# NDXPRO DataService 연계 API 가이드
### (Federated Digital Twin / Object ID ↔ Entity·Context 파라미터 매핑)

본 문서는 `LatestPohangAtmMarModel`(포항 대기·해양 관측) 데이터가 적재되어 있다는 전제 하에,
**Federated Digital Twin ID / Federated Digital Object ID 등의 설정값이 API 파라미터의 어디에 매핑되는지**와
**실제 호출 예시 / JSON 샘플**을 정리한 것입니다.

| 항목 | 값 |
|---|---|
| **Base URL** | `http://ndxpro-server:54002/ndxpro/v1/service` |
| **인증** | `Authorization: Bearer {ACCESS_TOKEN}` (전 API 공통 · 필수) |
| **토큰 파일** | `docs/access-token.txt` |
| **제공 API** | 조회 6종 (GET 전용) |
| **대상 데이터모델** | `LatestPohangAtmMarModel` |
| **Context** | `http://context-server:53005/fdt-twin-context-main-v1.0.1.jsonld` |
| **수집처(Provider)** | `UOS` |

> **연계 구조**
> `외부 시스템` → **DataService (`/ndxpro/v1/service`, 54002)** → `DataBroker (/ndxpro/v1/broker)` → `MongoDB`
> DataService는 DataBroker의 수집처(provider) 포함 조회 API를 호출하여, 정제된 형태로 응답합니다.

---

## 0. 한눈에 보는 매핑 표

아래는 실제 적재되어 있는 문서(예시)입니다.

```json
{
  "_id": {
    "id": "urn:ngsi-ld:LatestPohangAtmMarModel:KR-104111-0111",
    "type": "LatestPohangAtmMarModel",
    "servicePath": "UOS"
  },
  "@context": "http://context-server:53005/fdt-twin-context-main-v1.0.1.jsonld",
  "attrNames": { "federatedDigitalObjectId": "e8ight:federatedDigitalObjectId", ... },
  "attrs": [ { "name": "federatedDigitalObjectId", "type": "Property", "value": "KR-104111-0111", ... }, ... ]
}
```

| 고객사 설정값 | 저장 위치 | API 상의 위치 | 예시 값 |
|---|---|---|---|
| **Federated Digital Object ID** | `attrs[name=federatedDigitalObjectId].value` **및** `_id.id`의 마지막 세그먼트 | `entityId` (Path/Query) 의 마지막 세그먼트, 또는 `q=federatedDigitalObjectId==...` | `KR-104111-0111` |
| **Federated Digital Twin ID** | `attrs[name=federatedDigitalTwinId].value` | **`q` 파라미터로 조회** → `q=federatedDigitalTwinId==KR-01-M70130-20260001` | `KR-01-M70130-20260001` |
| **Entity ID** | `_id.id` | `GET /entities/iot/{entityId}` 의 Path Variable, `GET /entities/iot/history?entityId=` | `urn:ngsi-ld:LatestPohangAtmMarModel:KR-104111-0111` |
| **Data Model Type** | `_id.type` | `?type=` 파라미터 (**목록 조회 시 필수**) | `LatestPohangAtmMarModel` |
| **Context (Link)** | `@context` | **HTTP Header `Link`** | `http://context-server:53005/fdt-twin-context-main-v1.0.1.jsonld` |
| **수집처(Provider)** | `_id.servicePath` | 요청: `q=_id.servicePath==UOS` / 응답: `provider` 필드 (항상 포함) | `UOS` |
| **관측시각(observedAt)** | `attrs[].md[name=observedAt].value` | `timeproperty` = `{속성명}.observedAt`, `time` / `endTime` | `pm10.observedAt` |

> **핵심 요약**
> 1. `entityId = urn:ngsi-ld:{DataModelType}:{FederatedDigitalObjectId}` 규칙으로 만들어집니다.
> 2. `Federated Digital Twin ID`는 Entity ID에 포함되지 않고 **속성(Property)** 으로 저장되므로, `q` 파라미터로 조회합니다.
> 3. `Link` 헤더에는 데이터에 저장된 `@context` **URL 문자열이 100% 동일하게** 들어가야 합니다. (문자열 비교로 조회하므로 한 글자라도 다르면 404)
> 4. 모든 요청에 **`Authorization: Bearer {토큰}`** 헤더가 필요합니다.
> 5. **목록 조회 API는 값을 반환하지 않고 ID 목록만 반환**합니다. 실제 속성값은 단건 조회로 가져오는 **2단계 구조**입니다. (2.2절)

---

## 1. 공통 규격

### 1.1 Base URL

```
http://ndxpro-server:54002/ndxpro/v1/service
```

* 제공 API는 **조회(GET) 6종**입니다. 등록/수정/삭제 API는 제공하지 않습니다. (4장 참조)
* 응답 `Content-Type` : `application/json`

### 1.2 인증 (Authorization) — 모든 API 공통 필수

```
Authorization: Bearer <ACCESS_TOKEN>
```

| 항목 | 값 |
|---|---|
| 토큰 종류 | JWT (HS512) |
| 계정 | `e8ightAdmin2` (권한 `ADMIN`) |
| 발급일 | 2026-08-11 |
| 만료일 | 2076-07-29 (장기 발급) |
| 전달 위치 | HTTP Header `Authorization: Bearer {토큰}` |
| 파일 | `docs/access-token.txt` (한 줄 텍스트) |

셸에서 사용하실 경우 아래처럼 환경변수로 두면 편리합니다.

```bash
export DS_URL="http://ndxpro-server:54002/ndxpro/v1/service"
export DS_TOKEN="$(cat access-token.txt)"

curl --location "$DS_URL/entities/iot/urn:ngsi-ld:LatestPohangAtmMarModel:KR-104111-0111" \
--header "Link: <http://context-server:53005/fdt-twin-context-main-v1.0.1.jsonld>" \
--header "Authorization: Bearer $DS_TOKEN"
```

> ⚠️ 토큰은 ADMIN 권한 자격증명입니다. 형상관리(Git) 커밋 및 외부 노출에 주의해 주세요.
> (`docs/access-token.txt` 는 `.gitignore` 에 등록되어 있습니다.)

### 1.3 Link 헤더 (Context 지정 방법) — **가장 중요**

NGSI-LD 규격에 따라 `@context`는 HTTP `Link` 헤더로 전달합니다.

```
Link: <http://context-server:53005/fdt-twin-context-main-v1.0.1.jsonld>; rel="http://www.w3.org/ns/json-ld#context"; type="application/ld+json"
```

* `< >` 안의 URI만 추출하여 사용합니다. (`rel`, `type` 파라미터는 생략 가능하지만 규격상 권장)
* 추출된 URI는 문서의 `@context` 필드와 **정확히 일치(equals)** 해야 조회됩니다.
  * ❌ `https://` 로 바꾸거나, 끝에 `/` 를 붙이거나, 다른 버전(`v1.0.0`)을 넣으면 조회되지 않습니다.
* **단건 조회(`/entities/iot/{entityId}`, `/entities/{entityId}`)에서는 Link 헤더가 필수**입니다.
  (내부적으로 `entityId + @context` 두 조건으로 조회하므로, 누락 시 조회되지 않습니다.)
* **목록 · 이력 조회에서는 선택**이며, 생략 시 context 조건 없이 전체에서 조회합니다.
  단, 응답 바디의 `context` 필드는 `null` 로 반환됩니다.

### 1.4 Entity ID 명명 규칙

```
urn:{namespace}:{DataModelType}:{개별 식별자}
예) urn:ngsi-ld:LatestPohangAtmMarModel:KR-104111-0111
     └─┬─┘ └──┬──┘ └──────────┬──────────┘ └──────┬──────┘
      고정   네임스페이스      데이터모델 Type      Federated Digital Object ID
```

* 콜론(`:`)으로 구분된 **4개 세그먼트**여야 하며, 첫 세그먼트는 반드시 `urn` 입니다.
* 앞 3개 세그먼트(`urn:ngsi-ld:LatestPohangAtmMarModel:`)는 데이터관리자(DataManager)에 등록된 **데이터모델 ID**와 일치해야 합니다.
* 마지막 세그먼트에 **Federated Digital Object ID**를 그대로 사용합니다.

### 1.5 URL 인코딩

Query String 에 들어가는 값은 아래 문자를 인코딩해 주세요.

| 문자 | 인코딩 | 사용처 |
|---|---|---|
| `:` | `%3A` | `entityId`, `time`, `endTime` |
| `=` | `%3D` | `q` 의 `==` → `%3D%3D` |
| `;` | `%3B` | `q` 의 AND 구분자 |
| `>` / `<` | `%3E` / `%3C` | `q` 의 `>=`, `<=` |

예) `q=federatedDigitalTwinId==KR-01-M70130-20260001` → `q=federatedDigitalTwinId%3D%3DKR-01-M70130-20260001`

### 1.6 조회 파라미터에 쓰는 속성명

저장 문서에는 `attrNames`(축약명 → Context URI 매핑)와 `attrs`(실제 값)가 나뉘어 저장되어 있지만,
**API 요청/응답에서는 항상 축약명(short name)을 사용**합니다.

| 저장 형태 | API에서 사용하는 값 |
|---|---|
| `"attrNames": { "pm10": "e8ight:pm10" }` | `pm10` |
| `"attrs": [{ "name": "pm10", "value": 32.2 }]` | `q=pm10>=30`, `sortproperty=pm10` |
| `"md": [{ "name": "observedAt", ... }]` | `timeproperty=pm10.observedAt` |

> `e8ight:` 접두어(Context URI)는 내부 저장용이므로 **요청 파라미터에 넣지 않습니다.**

### 1.7 `q` (필터) 문법

| 연산자 | 의미 | 지원 Value Type |
|---|---|---|
| `==` | 일치 | String, DateTime String, Boolean, Integer, Double |
| `~=` | 부분일치(정규식, 대소문자 무시) | String |
| `>=` | 이상 | DateTime String, Integer, Double |
| `<=` | 이하 | DateTime String, Integer, Double |

* 여러 조건은 세미콜론(`;`)으로 연결하며 **AND** 조건입니다. → `q=pm10>=30;temp<=30`
* key에는 속성명(`pm10`) 또는 `속성명.하위속성명`(`pm10.observedAt`)을 사용합니다.
* `==`, `~=` 에 한해 **문서 키를 직접 지정**할 수 있습니다.

| API | Entity ID 키 | 수집처 키 |
|---|---|---|
| 목록 조회 (`/entities`, `/entities/iot`) | `_id.id` | `_id.servicePath` |
| 이력 조회 (`/entities/iot/history`) | — | `entity._id.servicePath` |

### 1.8 페이징 / 정렬

| 파라미터 | 기본값 | 설명 |
|---|---|---|
| `offset` | `0` | **페이지 번호**(0부터). 건수 오프셋이 아님에 유의 |
| `limit` | `50` | 페이지당 건수 |
| `sort` | `DESC` | `ASC` / `DESC` |
| `sortproperty` | 목록 `modDate` / 이력 `entity.modDate` | 정렬 기준 속성명 (`pm10`, `pm10.observedAt` 등 지정 가능) |

> 총 건수(`totalPage`, `totalData`)는 **응답 바디에 항상 포함**됩니다. 별도 `options` 파라미터는 필요 없습니다.

### 1.9 일시(DateTime) 포맷

| 구분 | 포맷 | 예시 |
|---|---|---|
| 조회 파라미터 `time`, `endTime` | `yyyy-MM-dd'T'HH:mm:ss.SSS` (**오프셋 없음, UTC 기준**) | `2026-08-28T00:00:00.000` |
| 응답의 `observedAt` | UTC 오프셋 포함 | `2026-08-28T00:08:38.000+00:00` |

> ⚠️ 요청 시 `+09:00`, `Z` 등의 오프셋을 붙이면 파싱 오류가 발생합니다. **UTC 기준의 오프셋 없는 문자열**로 보내주세요.

---

## 2. API 목록 및 조회 흐름

### 2.1 제공 API (조회 6종)

| # | 기능 | Method | URL | 필수 파라미터 |
|---|---|---|---|---|
| 1 | IoT Entity 목록 조회 (ID 목록) | GET | `/ndxpro/v1/service/entities/iot` | `type` |
| 2 | IoT Entity 단건 조회 (전체 속성값) | GET | `/ndxpro/v1/service/entities/iot/{entityId}` | `entityId`, `Link` |
| 3 | IoT Entity 이력 목록 조회 (이력 ID 목록) | GET | `/ndxpro/v1/service/entities/iot/history` | `entityId`, `timeproperty` |
| 4 | IoT Entity 이력 단건 조회 (전체 속성값) | GET | `/ndxpro/v1/service/entities/iot/history/{historyId}` | `historyId`, `timeproperty` |
| 5 | (일반) Entity 목록 조회 (ID 목록) | GET | `/ndxpro/v1/service/entities` | `type` |
| 6 | (일반) Entity 단건 조회 (전체 속성값) | GET | `/ndxpro/v1/service/entities/{entityId}` | `entityId`, `Link` |

> * `/entities/iot/**` : IoT 수집 파이프라인으로 적재된 **최신값 및 이력** 대상
> * `/entities/**` : 범용 Entity 컬렉션 대상 (IoT 데이터도 복제 저장되므로 대부분 동일한 결과, 단 이력 조회 불가)
> * 예시로 주신 `LatestPohangAtmMarModel` 데이터는 **`/entities/iot` 계열 사용을 권장**합니다.

### 2.2 조회 흐름 — **2단계 구조** (가장 중요)

목록 조회 API는 **속성값을 반환하지 않고 ID와 수집처만** 반환합니다.
실제 측정값은 반환된 ID로 단건 조회를 한 번 더 호출해야 합니다.

```
[최신값 조회]
  ① GET /entities/iot?type=LatestPohangAtmMarModel&q=federatedDigitalTwinId==...
       → { entities: [ { provider, entityId } ] }        ← ID 목록만
  ② GET /entities/iot/{entityId}   + Link 헤더
       → { provider, entity: { pm10, pm25, ... } }       ← 전체 속성값

[이력 조회]
  ① GET /entities/iot/history?entityId=...&timeproperty=pm10.observedAt&timerel=between&time=...&endTime=...
       → { entityHistoryList: [ { historyId, entityId, observedAt, provider } ] }   ← 이력 ID 목록만
  ② GET /entities/iot/history/{historyId}?timeproperty=pm10.observedAt
       → { historyId, observedAt, provider, entity: { pm10, ... } }                 ← 전체 속성값
```

> 이미 Entity ID를 알고 계신 경우(= Federated Digital Object ID로 조립 가능한 경우)에는
> ①단계를 건너뛰고 곧바로 ②단계 단건 조회를 호출하시면 됩니다.

---

## 3. API 상세 및 호출 예시

> 아래 모든 예시는 그대로 복사하여 실행 가능한 형태입니다. (Postman `Raw text` 붙여넣기 가능)

### 3.0 참고 — 검증된 호출 예시 (Todos3 샘플)

실제 동작이 확인된 이력 목록 조회 호출 형태입니다. 이 형식을 그대로 따라 주시면 됩니다.

```bash
curl --location 'http://ndxpro-server:54002/ndxpro/v1/service/entities/iot/history?entityId=urn%3Angsi-ld%3ATodos3%3A1&limit=16&timeproperty=completed.observedAt&sortproperty=completed.observedAt&time=2026-06-25T14%3A24%3A00.0&endTime=2026-08-25T14%3A24%3A00.0&timerel=between&offset=0' \
--header 'Authorization: Bearer <ACCESS_TOKEN>'
```

---

### 3.1 [1] IoT Entity 목록 조회 — Federated Digital Twin ID 기준

Twin ID는 Entity ID에 포함되지 않으므로 `q` 파라미터로 조회합니다.
`type` 은 **필수** 파라미터입니다.

**Twin ID로 해당 트윈에 속한 모든 Object 조회**

```bash
curl --location 'http://ndxpro-server:54002/ndxpro/v1/service/entities/iot?type=LatestPohangAtmMarModel&q=federatedDigitalTwinId%3D%3DKR-01-M70130-20260001&offset=0&limit=50' \
--header 'Link: <http://context-server:53005/fdt-twin-context-main-v1.0.1.jsonld>; rel="http://www.w3.org/ns/json-ld#context"; type="application/ld+json"' \
--header 'Authorization: Bearer <ACCESS_TOKEN>'
```

**Object ID로 조회 (속성 기준)**

```bash
curl --location 'http://ndxpro-server:54002/ndxpro/v1/service/entities/iot?type=LatestPohangAtmMarModel&q=federatedDigitalObjectId%3D%3DKR-104111-0111' \
--header 'Authorization: Bearer <ACCESS_TOKEN>'
```

**Twin ID + Object ID 복합 조회** (`;` = AND → `%3B`)

```bash
curl --location 'http://ndxpro-server:54002/ndxpro/v1/service/entities/iot?type=LatestPohangAtmMarModel&q=federatedDigitalTwinId%3D%3DKR-01-M70130-20260001%3BfederatedDigitalObjectId%3D%3DKR-104111-0111' \
--header 'Authorization: Bearer <ACCESS_TOKEN>'
```

**수집처 + 측정값 조건 조회** (`pm10>=30` → `pm10%3E%3D30`)

```bash
curl --location 'http://ndxpro-server:54002/ndxpro/v1/service/entities/iot?type=LatestPohangAtmMarModel&q=_id.servicePath%3D%3DUOS%3Bpm10%3E%3D30&sortproperty=pm10.observedAt&sort=DESC&offset=0&limit=50' \
--header 'Authorization: Bearer <ACCESS_TOKEN>'
```

| 파라미터 | 위치 | 필수 | 설명 | 예시 |
|---|---|---|---|---|
| `type` | Query | **O** | 데이터모델 Type | `LatestPohangAtmMarModel` |
| `q` | Query | X | 속성 필터 (1.7절 참조) | `federatedDigitalTwinId==KR-01-M70130-20260001` |
| `offset` | Query | X | 페이지 번호 (기본 0) | `0` |
| `limit` | Query | X | 페이지 크기 (기본 50) | `50` |
| `sort` | Query | X | `ASC`/`DESC` (기본 DESC) | `DESC` |
| `sortproperty` | Query | X | 정렬 속성 (기본 `modDate`) | `pm10.observedAt` |
| `Link` | Header | X | Context URL. 지정 시 해당 context 데이터만 조회 | 상단 참조 |
| `Authorization` | Header | **O** | `Bearer {토큰}` | 상단 참조 |

**Response (200)** — **ID와 수집처만 반환됩니다. 속성값은 3.2 단건 조회로 확인하세요.**

```json
{
  "context": "http://context-server:53005/fdt-twin-context-main-v1.0.1.jsonld",
  "model": "LatestPohangAtmMarModel",
  "totalPage": 1,
  "totalData": 1,
  "entities": [
    {
      "provider": "UOS",
      "entityId": "urn:ngsi-ld:LatestPohangAtmMarModel:KR-104111-0111"
    }
  ]
}
```

| 응답 필드 | 설명 |
|---|---|
| `context` | 요청 시 보낸 `Link` 헤더에서 추출한 Context URL (미지정 시 `null`) |
| `model` | 요청한 데이터모델 Type |
| `totalPage` | 전체 페이지 수 |
| `totalData` | 전체 건수 |
| `entities[].provider` | 수집처 (`_id.servicePath`) |
| `entities[].entityId` | Entity ID (`_id.id`) |

---

### 3.2 [2] IoT Entity 단건 조회 — 전체 속성값

**Federated Digital Object ID → Entity ID 변환** 후 호출합니다. `Link` 헤더가 필수입니다.

**Request**

```bash
curl --location 'http://ndxpro-server:54002/ndxpro/v1/service/entities/iot/urn:ngsi-ld:LatestPohangAtmMarModel:KR-104111-0111' \
--header 'Link: <http://context-server:53005/fdt-twin-context-main-v1.0.1.jsonld>; rel="http://www.w3.org/ns/json-ld#context"; type="application/ld+json"' \
--header 'Authorization: Bearer <ACCESS_TOKEN>'
```

| 파라미터 | 위치 | 필수 | 설명 |
|---|---|---|---|
| `entityId` | Path | **O** | `urn:ngsi-ld:{Type}:{FederatedDigitalObjectId}` |
| `Link` | Header | **O** | 데이터의 `@context` URL (미지정 시 조회되지 않음) |
| `Authorization` | Header | **O** | `Bearer {토큰}` |

**Response (200)** — 수집처(`provider`)와 전체 속성값(`entity`)이 반환됩니다.

```json
{
  "provider": "UOS",
  "entity": {
    "id": "urn:ngsi-ld:LatestPohangAtmMarModel:KR-104111-0111",
    "type": "LatestPohangAtmMarModel",
    "@context": "http://context-server:53005/fdt-twin-context-main-v1.0.1.jsonld",
    "federatedDigitalObjectId": {
      "type": "Property",
      "value": "KR-104111-0111",
      "observedAt": "2026-08-28T00:10:01.528+00:00"
    },
    "federatedDigitalTwinId": {
      "type": "Property",
      "value": "KR-01-M70130-20260001",
      "observedAt": "2026-08-28T00:10:01.528+00:00"
    },
    "atmLogDateTime": { "type": "Property", "value": "2026-08-28 09:08:38", "observedAt": "2026-08-28T00:08:38.000+00:00" },
    "atmDevId":       { "type": "Property", "value": 24,      "observedAt": "2026-08-28T00:08:38.000+00:00" },
    "pm10":           { "type": "Property", "value": 32.2,    "observedAt": "2026-08-28T00:08:38.000+00:00" },
    "pm25":           { "type": "Property", "value": 18.4,    "observedAt": "2026-08-28T00:08:38.000+00:00" },
    "so2":            { "type": "Property", "value": 0.042,   "observedAt": "2026-08-28T00:08:38.000+00:00" },
    "no2":            { "type": "Property", "value": 0.005,   "observedAt": "2026-08-28T00:08:38.000+00:00" },
    "o3":             { "type": "Property", "value": 0.032,   "observedAt": "2026-08-28T00:08:38.000+00:00" },
    "co":             { "type": "Property", "value": 0.397,   "observedAt": "2026-08-28T00:08:38.000+00:00" },
    "voc":            { "type": "Property", "value": 11.715,  "observedAt": "2026-08-28T00:08:38.000+00:00" },
    "h2s":            { "type": "Property", "value": 0.003,   "observedAt": "2026-08-28T00:08:38.000+00:00" },
    "nh3":            { "type": "Property", "value": 0.005,   "observedAt": "2026-08-28T00:08:38.000+00:00" },
    "ou":             { "type": "Property", "value": 3,       "observedAt": "2026-08-28T00:08:38.000+00:00" },
    "hcho":           { "type": "Property", "value": 0.001,   "observedAt": "2026-08-28T00:08:38.000+00:00" },
    "co2":            { "type": "Property", "value": 0.0433,  "observedAt": "2026-08-28T00:08:38.000+00:00" },
    "temp":           { "type": "Property", "value": 27.6,    "observedAt": "2026-08-28T00:08:38.000+00:00" },
    "humi":           { "type": "Property", "value": 85.8,    "observedAt": "2026-08-28T00:08:38.000+00:00" },
    "winsp":          { "type": "Property", "value": 0.853,   "observedAt": "2026-08-28T00:08:38.000+00:00" },
    "windir":         { "type": "Property", "value": 8.8,     "observedAt": "2026-08-28T00:08:38.000+00:00" },
    "atmBatt":        { "type": "Property", "value": 12.3,    "observedAt": "2026-08-28T00:08:38.000+00:00" },
    "marLogDateTime": { "type": "Property", "value": "2026-08-28 09:04:27", "observedAt": "2026-08-28T00:04:27.000+00:00" },
    "marDevId":       { "type": "Property", "value": 5,       "observedAt": "2026-08-28T00:04:27.000+00:00" },
    "marTimestamp":   { "type": "Property", "value": "2026-08-28 09:04:27", "observedAt": "2026-08-28T00:04:27.000+00:00" },
    "temper":         { "type": "Property", "value": 24.77,    "observedAt": "2026-08-28T00:04:27.000+00:00" },
    "doxygen":        { "type": "Property", "value": 6.43,     "observedAt": "2026-08-28T00:04:27.000+00:00" },
    "ec":             { "type": "Property", "value": 44767.71, "observedAt": "2026-08-28T00:04:27.000+00:00" },
    "salinity":       { "type": "Property", "value": 30.28,    "observedAt": "2026-08-28T00:04:27.000+00:00" },
    "tds":            { "type": "Property", "value": 30134.73, "observedAt": "2026-08-28T00:04:27.000+00:00" },
    "ph":             { "type": "Property", "value": 8.17,     "observedAt": "2026-08-28T00:04:27.000+00:00" },
    "orp":            { "type": "Property", "value": 137.94,   "observedAt": "2026-08-28T00:04:27.000+00:00" },
    "marBatt":        { "type": "Property", "value": 91.0,     "observedAt": "2026-08-28T00:04:27.000+00:00" },
    "flowVelocity":   { "type": "Property", "value": 12.55,    "observedAt": "2026-08-28T00:04:27.000+00:00" },
    "gpsLati":        { "type": "Property", "value": 0.0,      "observedAt": "2026-08-28T00:04:27.000+00:00" },
    "gpsLongi":       { "type": "Property", "value": 0.0,      "observedAt": "2026-08-28T00:04:27.000+00:00" },
    "waterDepth":     { "type": "Property", "value": 0.0,      "observedAt": "2026-08-28T00:04:27.000+00:00" }
  }
}
```

> **저장 구조 → 응답 변환 규칙**
> * `_id.id` → `entity.id`, `_id.type` → `entity.type`, `_id.servicePath` → `provider`
> * `attrs[]`의 각 원소 → `{name}: { "type": ..., "value": ... }`
> * `md[]`의 `observedAt` / `unitCode` → 속성 객체 내부에 평탄화(flatten)
> * `attrNames`, `mdNames`, `creDate`, `modDate`는 응답에 포함되지 않습니다.

---

### 3.3 [3] IoT Entity 이력 목록 조회

특정 Entity의 **과거 수집 이력 ID 목록**을 관측시각 기준으로 조회합니다.

```bash
curl --location 'http://ndxpro-server:54002/ndxpro/v1/service/entities/iot/history?entityId=urn%3Angsi-ld%3ALatestPohangAtmMarModel%3AKR-104111-0111&timeproperty=pm10.observedAt&timerel=between&time=2026-08-28T00%3A00%3A00.000&endTime=2026-08-28T23%3A59%3A59.999&sort=DESC&sortproperty=entity.modDate&offset=0&limit=100' \
--header 'Link: <http://context-server:53005/fdt-twin-context-main-v1.0.1.jsonld>' \
--header 'Authorization: Bearer <ACCESS_TOKEN>'
```

| 파라미터 | 위치 | 필수 | 설명 |
|---|---|---|---|
| `entityId` | Query | **O** | 조회 대상 Entity ID (URL 인코딩 권장) |
| `timeproperty` | Query | **O** | 시간 기준 속성. `{속성명}.observedAt` 형식 (예: `pm10.observedAt`, `marTimestamp.observedAt`) |
| `timerel` | Query | X | `before` / `after` / `between` |
| `time` | Query | △ | `timerel` 지정 시 필수. `yyyy-MM-ddTHH:mm:ss.SSS` (UTC, 오프셋 없음) |
| `endTime` | Query | △ | `timerel=between` 인 경우 필수 |
| `q` | Query | X | 추가 속성 필터 (수집처는 `entity._id.servicePath`) |
| `offset`/`limit`/`sort` | Query | X | 1.8절 참조 |
| `sortproperty` | Query | X | 기본값 `entity.modDate` |
| `Link` | Header | X | Context URL |
| `Authorization` | Header | **O** | `Bearer {토큰}` |

**Response (200)** — **이력 ID 목록만 반환됩니다. 속성값은 3.4로 확인하세요.**

```json
{
  "context": "http://context-server:53005/fdt-twin-context-main-v1.0.1.jsonld",
  "timeproperty": "pm10.observedAt",
  "totalPage": 3,
  "totalData": 241,
  "entityHistoryList": [
    {
      "historyId": "66cf1a2b7c1d4e5f6a7b8c9d",
      "entityId": "urn:ngsi-ld:LatestPohangAtmMarModel:KR-104111-0111",
      "observedAt": "2026-08-28T00:08:38.000+00:00",
      "provider": "UOS"
    },
    {
      "historyId": "66cf19f07c1d4e5f6a7b8c9c",
      "entityId": "urn:ngsi-ld:LatestPohangAtmMarModel:KR-104111-0111",
      "observedAt": "2026-08-28T00:07:38.000+00:00",
      "provider": "UOS"
    }
  ]
}
```

---

### 3.4 [4] IoT Entity 이력 단건 조회 — 전체 속성값

3.3에서 받은 `historyId` 로 해당 시점의 전체 속성값을 조회합니다.

```bash
curl --location 'http://ndxpro-server:54002/ndxpro/v1/service/entities/iot/history/66cf1a2b7c1d4e5f6a7b8c9d?timeproperty=pm10.observedAt' \
--header 'Authorization: Bearer <ACCESS_TOKEN>'
```

| 파라미터 | 위치 | 필수 | 설명 |
|---|---|---|---|
| `historyId` | Path | **O** | 3.3 응답의 `historyId` |
| `timeproperty` | Query | **O** | 3.3에서 사용한 것과 동일한 값 |
| `Authorization` | Header | **O** | `Bearer {토큰}` |

**Response (200)**

```json
{
  "historyId": "66cf1a2b7c1d4e5f6a7b8c9d",
  "timeproperty": "pm10.observedAt",
  "observedAt": "2026-08-28T00:08:38.000+00:00",
  "provider": "UOS",
  "entity": {
    "id": "urn:ngsi-ld:LatestPohangAtmMarModel:KR-104111-0111",
    "type": "LatestPohangAtmMarModel",
    "@context": "http://context-server:53005/fdt-twin-context-main-v1.0.1.jsonld",
    "federatedDigitalTwinId": { "type": "Property", "value": "KR-01-M70130-20260001", "observedAt": "2026-08-28T00:10:01.528+00:00" },
    "federatedDigitalObjectId": { "type": "Property", "value": "KR-104111-0111", "observedAt": "2026-08-28T00:10:01.528+00:00" },
    "pm10": { "type": "Property", "value": 32.2, "observedAt": "2026-08-28T00:08:38.000+00:00" },
    "pm25": { "type": "Property", "value": 18.4, "observedAt": "2026-08-28T00:08:38.000+00:00" },
    "temper": { "type": "Property", "value": 24.77, "observedAt": "2026-08-28T00:04:27.000+00:00" },
    "...": "... (3.2와 동일한 전체 속성)"
  }
}
```

---

### 3.5 [5][6] (일반) Entity 조회

IoT 이력이 필요 없는 경우 사용합니다. 요청·응답 형식은 3.1 / 3.2와 동일하며 경로에서 `/iot` 만 빠집니다.

```bash
# 목록 (ID 목록만 반환)
curl --location 'http://ndxpro-server:54002/ndxpro/v1/service/entities?type=LatestPohangAtmMarModel&q=federatedDigitalTwinId%3D%3DKR-01-M70130-20260001' \
--header 'Authorization: Bearer <ACCESS_TOKEN>'

# 단건 (전체 속성값)
curl --location 'http://ndxpro-server:54002/ndxpro/v1/service/entities/urn:ngsi-ld:LatestPohangAtmMarModel:KR-104111-0111' \
--header 'Link: <http://context-server:53005/fdt-twin-context-main-v1.0.1.jsonld>' \
--header 'Authorization: Bearer <ACCESS_TOKEN>'
```

---

## 4. 데이터 등록(연계 송신)에 대하여

**DataService(`/ndxpro/v1/service`)는 조회 전용입니다.** 등록/수정/삭제 API를 제공하지 않습니다.
데이터 송신이 필요한 경우 아래 두 가지 경로 중 하나를 사용하며, 별도 협의가 필요합니다.

| 경로 | 방식 | 비고 |
|---|---|---|
| **Kafka 토픽** (`ngsild.topic`) | 실시간 IoT 수집 | 현재 포항 대기·해양 데이터가 사용하는 경로. 수신 시 최신값·이력·범용 컬렉션에 동시 적재 |
| **DataBroker 직접 호출** | `POST /ndxpro/v1/broker/entities` (또는 `/entities/provider`) | 내부망 전용. 외부 공개되지 않음 |

참고로 DataBroker 등록 시의 페이로드 형식은 다음과 같습니다. (조회 응답의 `entity` 객체와 동일한 NGSI-LD 형태이며, **`observedAt` 에 오프셋이 없는 점**이 다릅니다.)

```json
{
  "id": "urn:ngsi-ld:LatestPohangAtmMarModel:KR-104111-0111",
  "type": "LatestPohangAtmMarModel",
  "federatedDigitalObjectId": { "type": "Property", "value": "KR-104111-0111",        "observedAt": "2026-08-28T00:10:01.528" },
  "federatedDigitalTwinId":   { "type": "Property", "value": "KR-01-M70130-20260001", "observedAt": "2026-08-28T00:10:01.528" },
  "atmLogDateTime": { "type": "Property", "value": "2026-08-28 09:08:38", "observedAt": "2026-08-28T00:08:38.000" },
  "atmDevId":       { "type": "Property", "value": 24,     "observedAt": "2026-08-28T00:08:38.000" },
  "pm10":           { "type": "Property", "value": 32.2,   "observedAt": "2026-08-28T00:08:38.000" },
  "pm25":           { "type": "Property", "value": 18.4,   "observedAt": "2026-08-28T00:08:38.000" },
  "so2":            { "type": "Property", "value": 0.042,  "observedAt": "2026-08-28T00:08:38.000" },
  "no2":            { "type": "Property", "value": 0.005,  "observedAt": "2026-08-28T00:08:38.000" },
  "o3":             { "type": "Property", "value": 0.032,  "observedAt": "2026-08-28T00:08:38.000" },
  "co":             { "type": "Property", "value": 0.397,  "observedAt": "2026-08-28T00:08:38.000" },
  "voc":            { "type": "Property", "value": 11.715, "observedAt": "2026-08-28T00:08:38.000" },
  "h2s":            { "type": "Property", "value": 0.003,  "observedAt": "2026-08-28T00:08:38.000" },
  "nh3":            { "type": "Property", "value": 0.005,  "observedAt": "2026-08-28T00:08:38.000" },
  "ou":             { "type": "Property", "value": 3,      "observedAt": "2026-08-28T00:08:38.000" },
  "hcho":           { "type": "Property", "value": 0.001,  "observedAt": "2026-08-28T00:08:38.000" },
  "co2":            { "type": "Property", "value": 0.0433, "observedAt": "2026-08-28T00:08:38.000" },
  "temp":           { "type": "Property", "value": 27.6,   "observedAt": "2026-08-28T00:08:38.000" },
  "humi":           { "type": "Property", "value": 85.8,   "observedAt": "2026-08-28T00:08:38.000" },
  "winsp":          { "type": "Property", "value": 0.853,  "observedAt": "2026-08-28T00:08:38.000" },
  "windir":         { "type": "Property", "value": 8.8,    "observedAt": "2026-08-28T00:08:38.000" },
  "atmBatt":        { "type": "Property", "value": 12.3,   "observedAt": "2026-08-28T00:08:38.000" },
  "marLogDateTime": { "type": "Property", "value": "2026-08-28 09:04:27", "observedAt": "2026-08-28T00:04:27.000" },
  "marDevId":       { "type": "Property", "value": 5,      "observedAt": "2026-08-28T00:04:27.000" },
  "marTimestamp":   { "type": "Property", "value": "2026-08-28 09:04:27", "observedAt": "2026-08-28T00:04:27.000" },
  "temper":         { "type": "Property", "value": 24.77,    "observedAt": "2026-08-28T00:04:27.000" },
  "doxygen":        { "type": "Property", "value": 6.43,     "observedAt": "2026-08-28T00:04:27.000" },
  "ec":             { "type": "Property", "value": 44767.71, "observedAt": "2026-08-28T00:04:27.000" },
  "salinity":       { "type": "Property", "value": 30.28,    "observedAt": "2026-08-28T00:04:27.000" },
  "tds":            { "type": "Property", "value": 30134.73, "observedAt": "2026-08-28T00:04:27.000" },
  "ph":             { "type": "Property", "value": 8.17,     "observedAt": "2026-08-28T00:04:27.000" },
  "orp":            { "type": "Property", "value": 137.94,   "observedAt": "2026-08-28T00:04:27.000" },
  "marBatt":        { "type": "Property", "value": 91.0,     "observedAt": "2026-08-28T00:04:27.000" },
  "flowVelocity":   { "type": "Property", "value": 12.55,    "observedAt": "2026-08-28T00:04:27.000" },
  "gpsLati":        { "type": "Property", "value": 0.0,      "observedAt": "2026-08-28T00:04:27.000" },
  "gpsLongi":       { "type": "Property", "value": 0.0,      "observedAt": "2026-08-28T00:04:27.000" },
  "waterDepth":     { "type": "Property", "value": 0.0,      "observedAt": "2026-08-28T00:04:27.000" },
  "@context": "http://context-server:53005/fdt-twin-context-main-v1.0.1.jsonld"
}
```

**등록 시 서버 처리 흐름**

1. `@context` URL을 실제로 HTTP GET 하여 용어 사전을 조회합니다. → **서버에서 접근 가능한 URL이어야 합니다.**
2. 각 속성명(`pm10` 등)을 Context에서 찾아 `attrNames`(`e8ight:pm10`)로 변환하여 저장합니다.
3. `urn:ngsi-ld:LatestPohangAtmMarModel:` 로 데이터관리자(DataManager)에 등록된 데이터모델을 조회해
   Type / 필수 속성 / 속성 valueType 유효성을 검증합니다.
4. 동일 `id` + `@context` 문서가 있으면 갱신, 없으면 신규 삽입합니다.

---

## 5. 연계 테스트 체크리스트

- [ ] 모든 요청에 `Authorization: Bearer {토큰}` 헤더를 넣었는가?
- [ ] Base URL이 `http://ndxpro-server:54002/ndxpro/v1/service` 인가?
- [ ] 목록 조회 시 `type` 파라미터를 넣었는가? (**필수**)
- [ ] 목록 조회 응답에 값이 없는 것은 정상이며, **단건 조회를 한 번 더 호출**해야 함을 반영했는가?
- [ ] `entityId`가 `urn:ngsi-ld:{Type}:{FederatedDigitalObjectId}` 4세그먼트 형식인가?
- [ ] 단건 조회에 `Link` 헤더를 포함했는가? (**필수**)
- [ ] `Link` 헤더의 URL이 데이터의 `@context` 문자열과 **완전히 동일**한가? (http/https, 포트, 파일명, 버전)
- [ ] Query String의 `:` `;` `=` `>` 를 URL 인코딩했는가?
- [ ] `q` / `sortproperty` / `timeproperty` 에 **축약 속성명**(`pm10`)을 사용했는가? (`e8ight:pm10` ❌)
- [ ] `time`, `endTime` 값이 **UTC 기준 · 오프셋 없는** `yyyy-MM-ddTHH:mm:ss.SSS` 형식인가?
- [ ] `offset`은 건수가 아닌 **페이지 번호**임을 반영했는가?
- [ ] 이력 조회 시 `timeproperty`를 `{속성명}.observedAt` 으로 지정했는가?
- [ ] 이력 단건 조회 시 목록 조회와 **동일한 `timeproperty`** 를 넣었는가?

## 6. 주요 오류

| 상황 | 응답 | 원인 |
|---|---|---|
| 인증 실패 | `401 Unauthorized` | `Authorization` 헤더 누락, `Bearer ` 접두어 누락, 토큰 만료·오타 |
| 권한 없음 | `403 Forbidden` | 해당 API 호출 권한이 없는 토큰 |
| 필수 파라미터 누락 | `400 Bad Request` | `type`, `entityId`, `timeproperty` 누락 |
| 해당 Entity 없음 | `RESOURCE_NOT_FOUND` | entityId 오타, 또는 **Link(@context) 불일치** |
| `q` 형식 오류 | `BAD_REQUEST_DATA` / `INVALID_REQUEST` | 지원하지 않는 연산자, key 깊이 3단계 이상, 인코딩 누락 |
| `timerel` 오류 | `INVALID_REQUEST` | `before`/`after`/`between` 외의 값, `between`인데 `endTime` 누락 |
| 날짜 파싱 실패 | `INVALID_REQUEST` | 오프셋(`+09:00`, `Z`) 포함, 밀리초 누락 |
| Context 조회 실패 | `INVALID_REQUEST` | `@context` URL 접근 불가 |
