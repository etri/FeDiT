"""
ConnectorRegistry - 로드된 커넥터를 등록하고 관리합니다.
"""

from typing import Dict, Any, Optional
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


class ConnectorRegistry:
    """
    커넥터 레지스트리
    로드된 모든 커넥터의 메타데이터와 구성 정보를 관리합니다.
    """

    def __init__(self) -> None:
        """초기화"""
        self._connectors: Dict[str, Dict[str, Any]] = {}

    def register(
        self,
        connector_id: str,
        config: Dict[str, Any],
        transform_func: Any,
    ) -> None:
        """
        커넥터 등록

        Args:
            connector_id: 커넥터 고유 ID
            config: CONNECTOR_CONFIG 딕셔너리
            transform_func: transform_source_data 함수
        """
        self._connectors[connector_id] = {
            "config": config,
            "transform_func": transform_func,
            "registered_at": datetime.utcnow().isoformat(),
        }
        logger.info(f"Connector registered: {connector_id}")

    def get(self, connector_id: str) -> Optional[Dict[str, Any]]:
        """
        커넥터 정보 조회

        Args:
            connector_id: 커넥터 ID

        Returns:
            커넥터 정보 딕셔너리 또는 None
        """
        return self._connectors.get(connector_id)

    def get_all(self) -> Dict[str, Dict[str, Any]]:
        """
        모든 커넥터 조회

        Returns:
            모든 커넥터 정보
        """
        return self._connectors.copy()

    def list_connector_ids(self) -> list[str]:
        """
        등록된 커넥터 ID 목록

        Returns:
            커넥터 ID 리스트
        """
        return list(self._connectors.keys())

    def is_registered(self, connector_id: str) -> bool:
        """
        커넥터 등록 여부 확인

        Args:
            connector_id: 커넥터 ID

        Returns:
            등록 여부
        """
        return connector_id in self._connectors

    def remove(self, connector_id: str) -> bool:
        """
        커넥터 제거

        Args:
            connector_id: 커넥터 ID

        Returns:
            제거 성공 여부
        """
        if connector_id in self._connectors:
            del self._connectors[connector_id]
            logger.info(f"Connector removed: {connector_id}")
            return True
        return False

    def clear(self) -> None:
        """모든 커넥터 제거"""
        self._connectors.clear()
        logger.info("All connectors cleared")

    def count(self) -> int:
        """
        등록된 커넥터 개수

        Returns:
            커넥터 개수
        """
        return len(self._connectors)
