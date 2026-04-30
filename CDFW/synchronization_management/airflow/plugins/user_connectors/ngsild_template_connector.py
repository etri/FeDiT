"""
사용자 커넥터 템플릿

✔ CONNECTOR_CONFIG만 수정하면 됨
✔ NGSI-LD 변환은 자동 처리됨
✔ attributes 생략 시 자동 매핑됨
✔ 복잡한 JSON은 source_root_path로 대응

--------------------------------------------------
[사용 방법]

1. 이 파일을 복사해서 {connector_name}_connector.py 형식으로 파일 생성
   예: pohang_marine_connector.py

2. CONNECTOR_CONFIG만 수정

3. Airflow 재시작 후 자동 실행

--------------------------------------------------
"""

from __future__ import annotations
from typing import Any, Dict

from connector_runtime.ngsi_ld import transform_with_config


CONNECTOR_CONFIG: Dict[str, Any] = {
    # -------------------------------
    # 기본 정보
    # -------------------------------
    "name": "my_ngsi_ld_connector",
    "description": "NGSI-LD 자동 변환 커넥터",
    "disabled": False,

    # -------------------------------
    # SOURCE API
    # -------------------------------
    "source": {
        "url": "https://api.example.com/data",
        "headers": {
            "User-Agent": "AirflowConnector/1.0",
        },
        "auth": {
            "type": "none",
        },
    },

    # -------------------------------
    # FDT TARGET
    # -------------------------------
    "fdt_target": {
        "base_url": "http://localhost:1212",
        "path_template": "/fedit/v1/digital-twins/{digital_twin_id}/digital-objects/{digital_object_id}/data",
        "path_params": {
            "digital_twin_id": "DT_ID",
            "digital_object_id": "DO_ID",
        },
        "auth": {
            "type": "none",
        },
    },

    # -------------------------------
    # 실행 옵션
    # -------------------------------
    "behavior": {
        "poll_interval_minutes": 1,
        "max_retries": 3,
        "timeout_seconds": 30,
        "backoff_factor": 2.0,
        "max_calls_per_minute": 60,
    },

    # -------------------------------
    # NGSI-LD 변환 설정
    # -------------------------------
    "ngsi_ld": {
        "enabled": True,

        # context (string 또는 list 모두 가능)
        "context": "https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld",

        # -----------------------------------
        # 🔥 중요: 중첩 JSON 대응
        # -----------------------------------
        # 예:
        # 응답이 {"result": {"data": {...}}} 구조라면
        # "source_root_path": "result.data"
        #
        # 없으면 최상위 dict 기준으로 자동 매핑
        #
        # "source_root_path": "result.data",

        # -----------------------------------
        # ENTITY 설정
        # -----------------------------------
        "entity": {
            "type": "MyObserved",

            # id 자동 생성 패턴
            # {type}, {field}, {nested.field} 지원
            "id_pattern": "urn:ngsi-ld:{type}:entity-001",

            # observedAt 설정
            "observedAt_path": "DATETIME",
            "observedAt_input_format": "%Y%m%d%H%M%S",
            "observedAt_output_format": "iso8601",
            "timezone": "UTC",

            # -----------------------------------
            # 🔥 필수 메타데이터 (권장)
            # -----------------------------------
            "static_attributes": {
                "name": {
                    "type": "Property",
                    "value": "디지털 객체 이름"
                },
                "description": {
                    "type": "Property",
                    "value": "디지털 객체 설명"
                },
                "owner": {
                    "type": "Property",
                    "value": "기관명"
                },
                "contactPoint": {
                    "type": "Property",
                    "value": "mailto:example@email.com"
                },
                "creator": {
                    "type": "Property",
                    "value": "NGSI-LD Connector"
                },
                "subject": {
                    "type": "Property",
                    "value": "Sensor Data"
                },
                "keywords": {
                    "type": "Property",
                    "value": "iot, sensor"
                },
                "source": {
                    "type": "Property",
                    "value": "External API"
                }
            },
        },

        # -----------------------------------
        # 🔥 attributes 설정 (선택)
        # -----------------------------------

        # ✔ 1. 자동 매핑 (추천)
        # attributes 생략하면 모든 key 자동 매핑됨
        #
        # ✔ 단, id/type/@context는 자동 제외됨

        # -----------------------------------
        # ✔ 2. 간단 리스트 방식
        #
        # "attributes": [
        #     "temperature",
        #     "humidity",
        #     "WIND_SPEED",
        # ],

        # -----------------------------------
        # ✔ 3. 정밀 매핑 방식 (운영 추천)
        #
        # "attributes": {
        #     "temperature": {
        #         "source_key": "TEMP",
        #         "type": "Property",
        #         "value_type": "number",
        #     },
        #     "windSpeed": {
        #         "source_key": "WIND_SPEED",
        #         "type": "Property",
        #         "value_type": "number",
        #     },
        #     "stationName": {
        #         "source_path": "station.name",
        #         "type": "Property",
        #         "value_type": "string",
        #     },
        # }
    },
}


def transform_source_data(data: Any, context: Dict[str, Any]) -> Dict[str, Any]:
    """
    공통 NGSI-LD 변환 함수 호출

    ⚠️ 수정하지 않아도 됨
    """
    return transform_with_config(
        data=data,
        context=context,
        config=CONNECTOR_CONFIG,
    )