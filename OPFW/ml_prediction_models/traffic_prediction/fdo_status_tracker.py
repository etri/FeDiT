#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
FDO 상태 추적 및 동적 데이터 수집 주기 관리
- 학습 완료 여부 추적
- 데이터 품질 점수 계산
- 동적 수집 주기 계산
"""

import time
import os
import pickle
from typing import Dict, Optional, Tuple
from datetime import datetime, timedelta


class FDOStatusTracker:
    """FDO별 상태 추적 및 수집 주기 관리"""
    
    def __init__(self, config: dict):
        self.config = config
        self.status_file = "fdo_status_cache.pkl"
        
        # FDO별 상태 정보
        self.fdo_status = self._load_status()
        
        # 설정에서 수집 주기 정보 로드
        self.collection_config = config.get("params", {}).get("data_collection", {})
        self.dynamic_scheduling = self.collection_config.get("dynamic_scheduling", True)
        
        # 수집 주기 설정
        self.intervals = self.collection_config.get("intervals", {})
        self.min_interval = self.collection_config.get("min_interval_seconds", 60)
        self.max_interval = self.collection_config.get("max_interval_seconds", 7200)
        
        # 데이터 품질 기준
        self.thresholds = self.collection_config.get("data_thresholds", {})
    
    def _load_status(self) -> Dict:
        """저장된 FDO 상태 로드"""
        if os.path.exists(self.status_file):
            try:
                with open(self.status_file, 'rb') as f:
                    return pickle.load(f)
            except Exception:
                pass
        return {}
    
    def _save_status(self):
        """FDO 상태 저장"""
        try:
            with open(self.status_file, 'wb') as f:
                pickle.dump(self.fdo_status, f)
        except Exception:
            pass
    
    def update_training_status(self, fdo_id: str, completed: bool, 
                             training_time: Optional[datetime] = None):
        """학습 완료 상태 업데이트"""
        if fdo_id not in self.fdo_status:
            self.fdo_status[fdo_id] = {}
        
        self.fdo_status[fdo_id]['training_completed'] = completed
        if training_time:
            self.fdo_status[fdo_id]['last_training_time'] = training_time
        else:
            self.fdo_status[fdo_id]['last_training_time'] = datetime.now()
        
        self._save_status()
    
    def update_data_quality(self, fdo_id: str, available_hours: int, 
                           last_collection_time: Optional[datetime] = None):
        """데이터 품질 정보 업데이트"""
        if fdo_id not in self.fdo_status:
            self.fdo_status[fdo_id] = {}
        
        self.fdo_status[fdo_id]['available_hours'] = available_hours
        if last_collection_time:
            self.fdo_status[fdo_id]['last_collection_time'] = last_collection_time
        else:
            self.fdo_status[fdo_id]['last_collection_time'] = datetime.now()
        
        # 데이터 품질 점수 계산 (0-100)
        quality_score = min(100, int((available_hours / self.thresholds.get('sufficient_hours', 216)) * 100))
        self.fdo_status[fdo_id]['data_quality_score'] = quality_score
        
        self._save_status()
    
    def calculate_collection_interval(self, fdo_id: str) -> int:
        """FDO별 데이터 수집 주기 계산 (초 단위)"""
        if not self.dynamic_scheduling:
            # 기본 주기 사용 (1시간)
            return 3600
        
        if fdo_id not in self.fdo_status:
            # 상태 정보가 없으면 기본값
            return self.intervals.get('insufficient_data', 600)
        
        status = self.fdo_status[fdo_id]
        
        # 1. 학습 완료 여부 확인
        if status.get('training_completed', False):
            interval = self.intervals.get('training_completed', 3600)
            return self._clamp_interval(interval)
        
        # 2. 데이터 품질에 따른 주기 결정
        available_hours = status.get('available_hours', 0)
        
        if available_hours >= self.thresholds.get('sufficient_hours', 216):
            interval = self.intervals.get('sufficient_data', 3600)
        elif available_hours >= self.thresholds.get('moderate_hours', 100):
            interval = self.intervals.get('moderate_data', 1800)
        elif available_hours >= self.thresholds.get('insufficient_hours', 50):
            interval = self.intervals.get('insufficient_data', 600)
        else:
            interval = self.intervals.get('very_insufficient_data', 120)
        
        return self._clamp_interval(interval)
    
    def _clamp_interval(self, interval: int) -> int:
        """수집 주기를 최소/최대 범위 내로 제한"""
        return max(self.min_interval, min(interval, self.max_interval))
    
    def should_collect_data(self, fdo_id: str) -> bool:
        """현재 데이터 수집이 필요한지 확인"""
        if fdo_id not in self.fdo_status:
            return True  # 상태 정보가 없으면 수집
        
        status = self.fdo_status[fdo_id]
        last_collection = status.get('last_collection_time')
        
        if not last_collection:
            return True  # 수집 기록이 없으면 수집
        
        # 마지막 수집으로부터 경과 시간 계산
        elapsed = (datetime.now() - last_collection).total_seconds()
        required_interval = self.calculate_collection_interval(fdo_id)
        
        return elapsed >= required_interval
    
    def get_collection_priority(self, fdo_id: str) -> int:
        """수집 우선순위 계산 (낮을수록 높은 우선순위)"""
        if fdo_id not in self.fdo_status:
            return 0  # 상태 정보가 없으면 최고 우선순위
        
        status = self.fdo_status[fdo_id]
        
        # 학습 완료된 FDO는 낮은 우선순위
        if status.get('training_completed', False):
            return 100
        
        # 데이터 품질에 따른 우선순위
        available_hours = status.get('available_hours', 0)
        
        if available_hours >= self.thresholds.get('sufficient_hours', 216):
            return 80
        elif available_hours >= self.thresholds.get('moderate_hours', 100):
            return 40
        elif available_hours >= self.thresholds.get('insufficient_hours', 50):
            return 20
        else:
            return 0  # 매우 부족한 데이터는 최고 우선순위
    
    def get_status_summary(self) -> Dict:
        """전체 FDO 상태 요약"""
        summary = {
            'total_fdos': len(self.fdo_status),
            'training_completed': 0,
            'data_quality_distribution': {
                'sufficient': 0,
                'moderate': 0,
                'insufficient': 0,
                'very_insufficient': 0
            },
            'collection_intervals': {
                '1h': 0,
                '30m': 0,
                '10m': 0,
                '2m': 0
            }
        }
        
        for fdo_id, status in self.fdo_status.items():
            # 학습 완료 상태
            if status.get('training_completed', False):
                summary['training_completed'] += 1
            
            # 데이터 품질 분포
            available_hours = status.get('available_hours', 0)
            if available_hours >= self.thresholds.get('sufficient_hours', 216):
                summary['data_quality_distribution']['sufficient'] += 1
            elif available_hours >= self.thresholds.get('moderate_hours', 100):
                summary['data_quality_distribution']['moderate'] += 1
            elif available_hours >= self.thresholds.get('insufficient_hours', 50):
                summary['data_quality_distribution']['insufficient'] += 1
            else:
                summary['data_quality_distribution']['very_insufficient'] += 1
            
            # 수집 주기 분포
            interval = self.calculate_collection_interval(fdo_id)
            if interval >= 3600:
                summary['collection_intervals']['1h'] += 1
            elif interval >= 1800:
                summary['collection_intervals']['30m'] += 1
            elif interval >= 600:
                summary['collection_intervals']['10m'] += 1
            else:
                summary['collection_intervals']['2m'] += 1
        
        return summary
    
    def log_status(self):
        """현재 상태 로그 출력"""
        summary = self.get_status_summary()
        print(f"[FDO Status] 총 FDO: {summary['total_fdos']}, "
              f"학습 완료: {summary['training_completed']}")
        print(f"[FDO Status] 데이터 품질 - "
              f"충분: {summary['data_quality_distribution']['sufficient']}, "
              f"중간: {summary['data_quality_distribution']['moderate']}, "
              f"부족: {summary['data_quality_distribution']['insufficient']}, "
              f"매우 부족: {summary['data_quality_distribution']['very_insufficient']}")
        print(f"[FDO Status] 수집 주기 - "
              f"1시간: {summary['collection_intervals']['1h']}, "
              f"30분: {summary['collection_intervals']['30m']}, "
              f"10분: {summary['collection_intervals']['10m']}, "
              f"2분: {summary['collection_intervals']['2m']}")


# 사용 예시
if __name__ == "__main__":
    # 테스트용 설정
    test_config = {
        "params": {
            "data_collection": {
                "dynamic_scheduling": True,
                "intervals": {
                    "training_completed": 3600,
                    "sufficient_data": 3600,
                    "moderate_data": 1800,
                    "insufficient_data": 600,
                    "very_insufficient_data": 120
                },
                "min_interval_seconds": 60,
                "max_interval_seconds": 7200,
                "data_thresholds": {
                    "sufficient_hours": 216,
                    "moderate_hours": 100,
                    "insufficient_hours": 50
                }
            }
        }
    }
    
    tracker = FDOStatusTracker(test_config)
    
    # 테스트 데이터 추가
    tracker.update_training_status("F-KR-109941-0001", True)
    tracker.update_data_quality("F-KR-109941-0001", 250)
    
    tracker.update_data_quality("F-KR-109941-0002", 150)
    tracker.update_data_quality("F-KR-109941-0003", 80)
    tracker.update_data_quality("F-KR-109941-0004", 30)
    
    # 상태 출력
    tracker.log_status()
    
    # 개별 FDO 수집 주기 확인
    for fdo_id in ["F-KR-109941-0001", "F-KR-109941-0002", "F-KR-109941-0003", "F-KR-109941-0004"]:
        interval = tracker.calculate_collection_interval(fdo_id)
        should_collect = tracker.should_collect_data(fdo_id)
        priority = tracker.get_collection_priority(fdo_id)
        print(f"{fdo_id}: 주기={interval}초, 수집필요={should_collect}, 우선순위={priority}")
