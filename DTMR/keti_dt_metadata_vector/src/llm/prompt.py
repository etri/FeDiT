import json
from langchain.prompts import PromptTemplate, FewShotPromptTemplate
from llm.models import llm
from db.elastic_schema import DTMETA_VECTOR_SCHEMA_DESCRIPTION


# ============================================================
# 1. 검색 쿼리 생성용 프롬프트 (Few-shot 기반)
# ============================================================

PREFIX = f"""
당신은 디지털트윈 메타데이터 검색 전문가입니다.
사용자의 자연어 질문을 이해하고, Elasticsearch 인덱스 `dtmeta_vector`에 적합한 JSON 형식의 검색 쿼리를 생성하세요.

----------------------------------------
[인덱스 스키마 요약]
{DTMETA_VECTOR_SCHEMA_DESCRIPTION}

----------------------------------------
[필드 설명 요약]
- metaTypeModel: 메타데이터 유형 (예: DigitalTwin, Sensor, Controller)
- metaModel: 세부 유형 (예: SingleDigitalTwin, FederatedDigitalTwin)
- name, description: 이름 / 설명 (description은 match 기반)
- keywords, subjects: 주요 키워드
- owner, creator: 작성자
- customFields.location: 지역명 (서울, 제주 등)
- creationTime, modificationTime: 생성 / 수정 시각

----------------------------------------
[검색 규칙]
1. 지역명(서울, 제주 등)은 description, keywords, customFields.location 3개 필드를 모두 검색해야 합니다.
2. metaTypeModel이 명시되지 않으면 기본값은 "DigitalTwin"입니다.
3. 개수나 통계 관련 질문은 "aggregation": true 를 포함해야 합니다.
4. 출력은 반드시 유효한 JSON만 생성합니다.
5. 불필요한 설명이나 문장은 출력하지 마세요.
6. "DigitalTwin"과 "DigitalTwinObject"는 별개의 유형입니다. 혼용하지 마세요.
   - "디지털트윈"은 metaTypeModel = "DigitalTwin"
   - "디지털트윈 객체"는 metaTypeModel = "DigitalTwinObject"
7. 시간 관련 표현("최근", "지난주", "이번 달", "오래된" 등)이 포함된 경우 다음 규칙을 따르세요.
   - "최근", "가장 최근", "최신"이 포함된 질문은 modificationTime 기준으로 내림차순 정렬(desc)을 적용하고,
     필요한 경우 modificationTime 또는 creationTime을 기준으로 최근 항목만 조회하도록 range 필터를 추가하세요.
   - "최근 N개월", "N일 이내"처럼 기간이 명시된 경우에는 creationTime 기준으로 gte(이후) 조건을 설정해 해당 기간 내 항목만 검색합니다.
     예: 최근 3개월 디지털 트윈 → creationTime >= (3개월 전 시점)
   - "오래된", "예전에 생성된" 등의 표현이 있을 경우 creationTime 기준 오름차순(asc)으로 정렬합니다.
8. "전체", "목록", "모두", "전부" 등의 단어가 포함된 경우, match_all 쿼리를 생성하고 정렬 기준은 creationTime 기준으로 설정하세요.
9. '동물', '환경', '기후', '스마트시티', '건축', '교통' 등 추상적 주제의 경우 vector_search를 true로 설정하여 의미 기반 검색을 수행하세요.
----------------------------------------
"""


# ------------------------------------------------------------
# Few-shot 예시
# ------------------------------------------------------------
EXAMPLES = [
    {
        "question": "제주도의 디지털 트윈 목록",
        "answer": """{
  "must": { "metaTypeModel": "DigitalTwin" },
  "filter": {
    "bool": {
      "should": [
        {"match": {"customFields.location": "제주"}},
        {"match": {"description": "제주"}},
        {"match": {"keywords": "제주"}}
      ],
      "minimum_should_match": 1
    }
  },
  "vector_search": false
}""",
    },
    {
        "question": "지역별 센서 분포 알려줘",
        "answer": """{
          "aggregation": true,
          "group_by": "location"
        }""",
    },
    {
        "question": "서울 지역의 디지털 트윈",
        "answer": """{
  "must": { "metaTypeModel": "DigitalTwin" },
  "filter": {
    "bool": {
      "should": [
        {"match": {"customFields.location": "서울"}},
        {"match": {"description": "서울"}},
        {"match": {"keywords": "서울"}}
      ],
      "minimum_should_match": 1
    }
  },
  "vector_search": false
}""",
    },
    {
        "question": "온도 관련 센서",
        "answer": """{
  "must": { "metaTypeModel": "Sensor" },
  "filter": {
    "bool": {
      "should": [
        {"match": {"description": "온도"}},
        {"match": {"text_all": "온도"}},
        {"term": {"keywords": "온도"}},
        {"term": {"subjects": "온도"}}
      ],
      "minimum_should_match": 1
    }
  },
  "vector_search": false
}""",
    },
    {
        "question": "객체 유형별로 몇 개인지 알려줘",
        "answer": """{
  "aggregation": true,
  "group_by": "metaTypeModel"
}""",
    },
    {
        "question": "단일 디지털트윈의 개수",
        "answer": """{
  "aggregation": true,
  "must": {
    "metaTypeModel": "DigitalTwin",
    "metaModel": "SingleDigitalTwin"
  }
}""",
    },
    {
        "question": "최근 2개월 내 서울 디지털 트윈",
        "answer": """{
  "must": {{ "metaTypeModel": "DigitalTwin" }},
  "filter": {{
    "bool": {{
      "should": [
        {{"wildcard": {{"customFields": "*서울*"}}}},
        {{"match": {{"text_all": "서울"}}}},
        {{"match": {{"description": "서울"}}}},
        {{"term": {{"keywords": "서울"}}}}
      ],
      "minimum_should_match": 1
    }},
    "modificationTime": {{
      "gte": "2개월 전"
    }}
  }},
  "sort": [{{"modificationTime": "desc"}}],
  "vector_search": false
}}""",
    },
    {
        "question": "최근 6개월 이내 제주에서 생성된 디지털 트윈 개수",
        "answer": """{
  "aggregation": true,
  "must": {
    "metaTypeModel": "DigitalTwin"
  },
  "filter": {
    "bool": {
      "should": [
        {{"match": {{"customFields.location": "제주"}}}},
        {{"match": {{"description": "제주"}}}},
        {{"match": {{"keywords": "제주"}}}}
      ],
      "minimum_should_match": 1
    }},
    "creationTime": {{
      "gte": "6개월 전"
    }}
  }}
}}""",
    },
]

# JSON 중괄호 이스케이프 (LangChain-safe)
for ex in EXAMPLES:
    ex["answer"] = ex["answer"].replace("{", "{{").replace("}", "}}")

# ------------------------------------------------------------
# Prompt 구성
# ------------------------------------------------------------
EXAMPLE_PROMPT = PromptTemplate(
    input_variables=["question", "answer"],
    template="질문: {question}\n응답 예시:\n{answer}\n",
)

QUERY_PROMPT = FewShotPromptTemplate(
    examples=EXAMPLES,
    example_prompt=EXAMPLE_PROMPT,
    prefix=PREFIX,
    suffix="질문: {question}\n출력(JSON 형식만):",
    input_variables=["question"],
)

# 검색 쿼리 생성 체인
query_gen_chain = QUERY_PROMPT | llm


# ============================================================
# 2. 검색 결과 요약 / 표 생성용 프롬프트
# ============================================================

RESPONSE_TEMPLATE = """
당신은 디지털트윈 메타데이터 검색 결과를 명확하게 요약하는 데이터 분석가입니다.

----------------------------------------
[질문]
{question}

[검색 결과]
{context}
----------------------------------------
[출력 규칙]

1. 기본 출력 형식
검색 결과는 반드시 다음 헤더를 가진 표 형태로 정리한다.
| 번호 | 이름 | 유형 | ID | 지역 | 설명 | 근거 |
|----|----|----|----|----|----|----|
| 1 | 센서A | Sensor | KR-001 | 제주 | 온도 측정 센서 | description에 '온도' 포함 |

표에 포함되는 정보가 없으면 **"정보 없음"**으로 표기한다.

2. 문서 필터링
질문과 직접적으로 관련된 문서만 결과 표에 포함한다. (예: "동물" 검색 시 환경, 센서 등 무관한 문서는 제외)
검색 결과가 없으면 **"검색 결과가 없습니다."**만 출력한다.

3. 근거 열 처리 (가장 중요)
근거 열은 항상 유지하며, 질문에 의해 필터링된 행에 대해서만 근거를 작성한다. 
예외: 질문이 전체 조회(전체 목록, 모두, match_all 등) 또는 특정 ID 상세 조회(id=, 상세, 정보) 유형일 경우, 근거 열을 삭제한다.

4. 근거를 작성규칙
    (A) 질문과 유의미하게 관련된 근거만을 작성한다. 
    (B) 문서에서 실제로 발견된 내용으로만 정확하게 작성한다.  
    (C) 여러 근거가 있다면 모두 작성한다(콤마로 구분).  
    (D) 근거 문장은 다음 패턴만 사용한다(짧게, 단문으로):
      - description에 '키워드' 포함  
      - keywords에 '키워드' 포함  
      - subjects에 '키워드' 포함  
      - 지역 정보에 '제주' 포함  
      - name에 '키워드' 포함  
      - 생성일: YYYY-MM-DD  
      - 수정일: YYYY-MM-DD  
      - (시간 관련 단어가 있는 경우)  
          질문에 ‘최근’, ‘최신’, ‘등록된’, ‘수정된’ 등이 있으면 creationTime 또는 modificationTime 중 실제 존재하는 값을 근거에 반드시 포함한다.

5. 지역은 “서울”, “제주” 등으로 간단히 표현한다.
    - customFields.location.* 기반으로 판단하며, 없으면 “정보 없음”.

6. 검색 결과가 없으면 “검색 결과가 없습니다.”만 출력한다.

7. 마지막 요약 문장은 다음 조건에 따라 다르게 작성하세요.
    - 벡터 검색의 경우 최종 출력 문서의 개수만 포함하여 **"총 M개의 문서가 검색되었습니다."** 형태로 작성해주세요.
   - 만약 [검색 결과] 상단에 "총 N개 문서 중 상위 M개만 표시"라는 문장이 포함되어 있다면,  
     **"총 N개 중 상위 M개 문서만 표시되었습니다."** 라고 명시적으로 써주세요.
   - 그렇지 않다면 **"총 M개의 문서가 검색되었습니다."** 형태로 작성하세요.
"""

response_prompt = PromptTemplate(
    input_variables=["question", "context"],
    template=RESPONSE_TEMPLATE.strip(),
)

response_chain = response_prompt | llm


# --------------------------------------
# 3. 집계 결과 요약용 프롬프트
# --------------------------------------
RESPONSE_AGG_TEMPLATE = """
당신은 디지털트윈 메타데이터 집계 결과를 있는 그대로 출력하는 전문가입니다.

[중요 규칙]
- 아래 context에 포함된 모든 집계 결과 라인을 절대 삭제하거나 요약하지 말고,
  순서 그대로 재출력한다.
- 불필요한 설명, 추가 문장, 요약 문구를 생성하지 않는다.
- context는 이미 집계 포맷으로 완성된 텍스트이므로,
  그대로 사용자에게 전달될 형태로 출력하면 된다.
- context 형식을 변경하지 말고, 괄호 및 기호도 그대로 유지한다.
- 마지막 총계도 context에 있는 그대로 출력한다.

출력:
{context}
"""

response_prompt_agg = PromptTemplate(
    input_variables=["question", "context"],
    template=RESPONSE_AGG_TEMPLATE.strip(),
)
