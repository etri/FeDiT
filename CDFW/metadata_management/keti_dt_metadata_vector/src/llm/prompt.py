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
        "question": "최근 생성된 디지털 트윈",
        "answer": """{
  "must": {{ "metaTypeModel": "DigitalTwin" }},
  "filter": {{
    "creationTime": {{
      "gte": "7일 전"
    }}
  }},
  "sort": [{{"creationTime": "desc"}}],
  "vector_search": false
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
1. 검색 결과가 있으면 반드시 표 형태로 정리하세요.
2. 표 형식:
| 번호 | 이름 | 유형 | ID | 지역 | 설명 | 근거 |
|----|----|----|----|----|----|----|
| 1 | 센서A | Sensor | KR-001 | 제주 | 온도 측정 센서 | description에 '온도' 포함 |
3. 지역 항목은 "서울", "제주" 와 같이 넣어주세요.
4. "근거" 작성 규칙:
   - 근거는 반드시 **사용자 질문에 포함된 주요 단어(키워드)** 와 실제 문서의 내용(description, keywords, subjects 등)이 일치할 때만 작성하세요.
      → 질문에 등장하지 않은 단어나 임의의 명사는 근거로 쓰지 마세요.
   - 지역 관련 단어가 있을 경우: "지역 정보에 '서울' 포함"처럼 표기하세요.
   - 질문에 '최근', '최신', '가장 최근', '오래된', '등록된', '생성된', '수정된' 등의 시간 관련 단어가 포함된 경우에는 반드시
    creationTime 또는 modificationTime 정보를 근거에 포함하세요.
    예: "최근 수정일: 2025-11-10", "생성일: 2025-09-05"
   - description, keywords, subjects, customFields.location 중 질문 키워드와 일치하거나 포함되는 항목이 있을 경우,
     그 필드를 명시적으로 근거에 써주세요. 
     예: "설명에 '서울' 포함", "키워드에 '온도' 포함", "주제어에 '센서' 포함"
5. **근거는 선택 항목입니다.**
   - 만약 LLM이 판단하기에 근거가 단순하거나 의미가 없다면, 생략할 수 있습니다. 
   (예) 지역명이 모두 동일한 경우
   - 단, 근거가 분석에 도움이 되거나 검색 조건과 관련 있다면 반드시 포함하세요.
   - 그러나 비슷한 문서라도 모두 표에 포함해야 합니다. 절대로 행을 생략하지 마세요.
6. 각 항목에 대한 정보가 없는 경우 "정보 없음" 으로 표시해주세요.
7. 결과가 없으면 "검색 결과가 없습니다."라고만 출력합니다.
8. 마지막 요약 문장은 다음 조건에 따라 다르게 작성하세요.
   - 만약 [검색 결과] 상단에 "총 N개 문서 중 상위 M개만 표시"라는 문장이 포함되어 있다면,  
     **"총 N개 중 상위 M개 문서만 표시되었습니다."** 라고 명시적으로 써주세요.
   - 그렇지 않다면 **"총 M개의 문서가 검색되었습니다."** 형태로 작성하세요.
9. 정보가 부족하거나 지역 정보가 없을 경우에는 “해당 지역 정보가 없습니다.” 등으로 명확히 표현하세요.
"""

response_prompt = PromptTemplate(
    input_variables=["question", "context"],
    template=RESPONSE_TEMPLATE.strip(),
)

response_chain = response_prompt | llm


# --------------------------------------
# 3. 집계 결과 요약용 프롬프트 (간단형)
# --------------------------------------
RESPONSE_AGG_TEMPLATE = """
당신은 디지털트윈 메타데이터의 집계 결과를 요약하는 데이터 분석가입니다.

질문:
{question}

집계 결과:
{context}

요약 규칙:
1. context는 집계 결과입니다. 문서 목록이 아닙니다.
2. (예) SingleDigitalTwin 17개, FederatedDigitalTwin 2개 -> 총 19개 입니다.
"""

response_prompt_agg = PromptTemplate(
    input_variables=["question", "context"],
    template=RESPONSE_AGG_TEMPLATE.strip(),
)
