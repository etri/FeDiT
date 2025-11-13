"""
ES_INDEX_NAME = "dtmeta_vector"
디지털트윈 메타데이터 인덱스 (RAG 검색의 핵심 문서 저장소)

이 인덱스는 '디지털트윈 / 센서 / 서비스' 등 메타데이터 객체를 저장하고,
LangChain Retriever에서 의미 기반 벡터 검색에 사용됩니다.
"""

DTMETA_VECTOR_SCHEMA = {
    "mappings": {
        "properties": {
            "id": {"type": "keyword"},  # 고유 식별자
            "metaTypeModel": {
                "type": "keyword"
            },  # 엔티티 타입 (예: DigitalTwin, Sensor, Service)
            "metaModel": {
                "type": "keyword"
            },  # 메타모델 유형 (예: SingleDigitalTwin 등)
            "name": {"type": "text", "analyzer": "standard"},  # 이름
            "description": {"type": "text", "analyzer": "standard"},  # 설명
            "subjects": {"type": "keyword"},  # 주제어
            "keywords": {"type": "keyword"},  # 키워드
            "owner": {"type": "keyword"},  # 소유자
            "creator": {"type": "keyword"},  # 작성자
            "creationTime": {"type": "date"},  # 생성 시각
            "modificationTime": {"type": "date"},  # 수정 시각
            "geometry": {"type": "geo_shape"},  # 공간 영역 정보
            "geometryCentroid": {"type": "geo_point"},  # 중심점
            "location": {  # 지역정보
                "properties": {
                    "addressRegion": {"type": "keyword"},  # 시/도
                    "addressLocality": {"type": "keyword"},  # 시/군/구
                    "addressCountry": {"type": "keyword"},  # 국가
                }
            },
            "embedding": {  # 벡터 필드 (RAG 검색 핵심)
                "type": "dense_vector",
                "dims": 384,
                "index": True,
                "similarity": "cosine",
            },
            "customFields": {"type": "object", "dynamic": True},  # 유연한 확장 필드
        }
    },
    "settings": {"number_of_shards": 1, "number_of_replicas": 0},
}

"""
ES_EDGES_INDEX_NAME = "dtmeta_edges"
디지털트윈 엔티티 간 관계 인덱스 (옵션)
"""

DTMETA_EDGES_SCHEMA = {
    "mappings": {
        "properties": {
            "sourceId": {"type": "keyword"},  # 부모 엔티티 ID
            "targetId": {"type": "keyword"},  # 자식 엔티티 ID
            "sourceMetaTypeModel": {"type": "keyword"},  # 부모 타입
            "targetMetaTypeModel": {"type": "keyword"},  # 자식 타입
            "prptyNm": {"type": "keyword"},  # 관계 이름
        }
    }
}


DTMETA_VECTOR_SCHEMA_DESCRIPTION = """
디지털트윈 메타데이터 인덱스(dtmeta_vector)의 주요 필드 구조는 다음과 같습니다.

이 인덱스는 디지털트윈, 센서, 서비스 등의 메타데이터 객체를 저장하며,
각 객체의 고유 식별자, 속성, 위치 정보, 사용자 정의 필드(customFields), 임베딩 벡터를 포함합니다.

──────────────────────────────────────────────
기본 메타 필드 (공통 속성)
──────────────────────────────────────────────
- id: 고유 식별자 (문서의 unique ID)
- name: 디지털트윈 또는 센서/서비스의 이름
- description: 객체의 상세 설명
- metaTypeModel: 엔티티 타입 (예: DigitalTwin, Sensor, Service)
- metaModel: 메타모델 유형 (예: SingleDigitalTwin 등)
- subjects: 주요 주제어 (예: 'K-POP', '농업', '환경')
- keywords: 검색용 키워드 목록
- owner: 데이터 소유자 (예: 기관명, 프로젝트명)
- creator: 작성자 (예: 시스템, 사용자)
- creationTime: 생성 시각 (ISO 8601)
- modificationTime: 수정 시각 (ISO 8601)
- geometry: 공간 영역 정보 (GeoJSON)
- geometryCentroid: 중심점 좌표 (geo_point)
- countryCode: 국가 코드 (예: KR)

──────────────────────────────────────────────
customFields (사용자 정의 확장 영역)
──────────────────────────────────────────────
customFields는 동적 확장 가능한 객체로, 각 엔티티별 추가 정보를 포함합니다.

주요 하위 필드는 다음과 같습니다:

- {{customFields.dtid}}: 디지털트윈 식별자 (예: KR-01-R90199-20250009)
- {{customFields.type}}: 디지털트윈 유형 (예: 단일, 복합)
- {{customFields.contactPoint}}: 연락처 정보 (전화번호, 이메일 등)
- {{customFields.pointOfAccess}}: 접근 가능한 API 또는 포털 URL
- {{customFields.sourceType}}: 데이터 출처 또는 연동 시스템 타입
- {{customFields.dataInterval}}: 데이터 수집 주기 (예: 5분, 1시간)
- {{customFields.sid}}: 센서 고유 ID 또는 소스 시스템 ID

──────────────────────────────────────────────
위치 관련 필드 (customFields.location)
──────────────────────────────────────────────
모든 위치 정보는 customFields.location 아래에 포함됩니다.

- {{customFields.location.addressCountry}}: 국가 (예: KR)
- {{customFields.location.addressRegion}}: 시/도 (예: 제주도, 서울특별시)
- {{customFields.location.addressLocality}}: 시/군/구 (예: 제주시, 강남구)
- {{customFields.installLocation}}: 설치 좌표 (geo_point 또는 geo_shape)

──────────────────────────────────────────────
벡터 임베딩 (RAG 검색용)
──────────────────────────────────────────────
- embedding: 텍스트 기반 의미 임베딩 벡터 (dense_vector, 차원: 384)
  • name, description, content 등을 조합해 생성
  • cosine 유사도로 벡터 검색 수행

──────────────────────────────────────────────
참고
──────────────────────────────────────────────
- customFields는 dynamic=True로 설정되어 있으며, 새 속성을 자유롭게 추가할 수 있습니다.
- 검색 시 vector_search=True이면 의미 기반 벡터 검색(kNN) 수행,
  vector_search=False이면 키워드 기반 match 검색 수행.
- customFields 내 필드 접근 시에는 "customFields.필드명" 또는 "customFields.location.addressRegion" 형태의 점(.) 표기법을 사용합니다.
"""
