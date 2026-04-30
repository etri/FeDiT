# 커넥터 개발 가이드

FederatedTwin 플랫폼에서 외부 API 데이터를 수집하여  
NGSI-LD 형태로 변환 후 FDT에 적재하는 커넥터 작성 방법을 안내합니다.

---

## 1. 개요

커넥터는 다음 역할을 수행합니다.

1. 외부 API 호출 (source)
2. 데이터 변환 (NGSI-LD)
3. FDT 플랫폼으로 전송

커넥터는 Airflow DAG (`run_registered_connectors`)에 의해 자동 실행됩니다.

---

## 2. 파일 생성

템플릿을 복사하여 새로운 커넥터를 생성합니다.

```bash
cp ~/airflow/plugins/user_connectors/_template_connector.py \
   ~/airflow/plugins/user_connectors/my_connector.py
```

파일명 규칙:

```
{name}_connector.py
```

예:

- weather_connector.py
- marine_connector.py

---

## 3. CONNECTOR_CONFIG 수정

커넥터는 CONNECTOR_CONFIG만 수정하면 됩니다.

**기본 구조**

```
CONNECTOR_CONFIG = {
    "name": "My Connector",
    "description": "설명",
    "disabled": False,

    "source": {
        "url": "https://api.example.com/data",
        "headers": {"User-Agent": "AirflowConnector/1.0"},
        "auth": {"type": "none"},
    },

    "fdt_target": {
        "base_url": "http://localhost:1212",
        "path_template": "/fedit/v1/digital-twins/{digital_twin_id}/digital-objects/{digital_object_id}/data",
        "path_params": {
            "digital_twin_id": "DT_ID",
            "digital_object_id": "DO_ID",
        },
        "auth": {"type": "none"},
    },

    "behavior": {
        "poll_interval_minutes": 5,
        "max_retries": 3,
        "timeout_seconds": 30,
        "backoff_factor": 2.0,
        "max_calls_per_minute": 60,
    },

    "ngsi_ld": {
        "enabled": True,
        "context": "https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld",

        "entity": {
            "type": "MyObserved",
            "id_pattern": "urn:ngsi-ld:{type}:entity-001",
        },
    },
}
```

---

## 4. 주요 설정 설명

### 4.1 source

외부 API 호출 설정

- url: 데이터 수집 API
- headers: HTTP 헤더
- auth: 인증 방식

예:

```
https://api.example.com/data?serviceKey=...
```

✔ query parameter 형태 인증 지원
✔ 실제 요청은 원본 URL 사용
✔ 로그에는 민감정보 자동 마스킹됨

### 4.2 fdt_target

FDT 전송 대상 설정

- base_url + path_template + path_params → 최종 endpoint 생성

예:

```
/fedit/v1/digital-twins/{digital_twin_id}/digital-objects/{digital_object_id}/data
```

### 4.3 behavior

실행 제어 옵션

- poll_interval_minutes: 실행 주기
- max_retries: 재시도 횟수
- timeout_seconds: 요청 타임아웃

---

## 5. NGSI-LD 변환

`ngsi_ld.enabled = True`이면 자동 변환이 수행됩니다.

### 5.1 기본 Entity 설정

```
"entity": {
    "type": "WeatherObserved",
    "id_pattern": "urn:ngsi-ld:{type}:{stationId}",
}
```

지원:

- {type}
- {field}
- {nested.field}

### 5.2 observedAt 자동 변환

```
"observedAt_path": "DATETIME",
"observedAt_input_format": "%Y%m%d%H%M%S",
"observedAt_output_format": "iso8601",
"timezone": "UTC"
```

예:

```
20260401161000 → 2026-04-01T16:10:00Z
```

### 5.3 메타데이터 설정 (권장)

```
"static_attributes": {
    "name": {"type": "Property", "value": "객체 이름"},
    "description": {"type": "Property", "value": "설명"},
    "owner": {"type": "Property", "value": "기관"},
    "contactPoint": {"type": "Property", "value": "mailto:..."},
    "creator": {"type": "Property", "value": "Connector"},
    "subject": {"type": "Property", "value": "Sensor"},
    "keywords": {"type": "Property", "value": "iot, data"},
}
```

---

## 6. attributes 설정

### ✔ 6.1. 자동 매핑 (추천)

```
"ngsi_ld": {
    "enabled": True
}
```

→ 모든 key 자동 변환

단, 아래는 제외됨:

- id
- type
- @context

### ✔ 6.2. 중첩 JSON 처리

```
"source_root_path": "result.data"
```

→ 해당 경로 아래만 attribute 변환

### ✔ 6.3. 리스트 방식

```
"attributes": ["temperature", "humidity"]
```

→ 해당 key만 자동 탐색

### ✔ 6.4. 딕셔너리 방식 (운영 추천)

```
"attributes": {
    "windSpeed": {
        "source_key": "WIND_SPEED",
        "type": "Property",
        "value_type": "number",
    },
    "stationName": {
        "source_path": "station.name",
        "type": "Property",
        "value_type": "string",
    }
}
```

---

## 7. transform 함수

일반적으로 수정할 필요 없음

```
def transform_source_data(data, context):
    return transform_with_config(data=data, context=context, config=CONNECTOR_CONFIG)
```

---

## 8. 실행

```
cd ~/airflow
airflow dags trigger run_registered_connectors
```

---

## 9. 로그 확인

```
~/airflow/logs/dag_id=run_registered_connectors/
```

---

## 10. 디버깅 체크리스트

- 파일명: \_connector.py로 끝나는지
- CONNECTOR_CONFIG가 최상단에 있는지
- disabled=False인지
- source.url 정상인지
- API 응답이 JSON인지
- attributes 키가 실제 데이터와 일치하는지

---

## 11. 예시

포항 해양 API 커넥터:

- URL: marineweather API
- 인증: query parameter (serviceKey)
- 자동 매핑 사용
- 1분 폴링

---

## 12. 요약

✔ CONNECTOR_CONFIG만 수정하면 된다
✔ NGSI-LD 변환은 자동 수행된다
✔ attributes 생략 시 자동 매핑
✔ 복잡한 JSON은 source_root_path 사용
✔ 운영 환경에서는 dict 방식 추천
