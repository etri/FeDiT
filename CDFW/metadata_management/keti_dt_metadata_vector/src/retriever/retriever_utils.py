import re, json, dateparser
from datetime import datetime, timedelta
from dateutil.relativedelta import relativedelta


# -----------------------------
# 지역명 필터
# -----------------------------

REGION_ALIASES = {
    "서울": ["서울", "서울특별시", "서울시", "Seoul", "Seoul City", "Seoul-si"],
    "부산": ["부산", "부산광역시", "부산시", "Busan", "Busan City", "Busan-si"],
    "대구": ["대구", "대구광역시", "Daegu", "Daegu City"],
    "인천": ["인천", "인천광역시", "Incheon", "Incheon City"],
    "광주": ["광주", "광주광역시", "Gwangju", "Gwangju City"],
    "대전": ["대전", "대전광역시", "Daejeon", "Daejeon City"],
    "울산": ["울산", "울산광역시", "Ulsan", "Ulsan City"],
    "세종": ["세종", "세종특별자치시", "Sejong", "Sejong City"],
    "경기": ["경기", "경기도", "Gyeonggi", "Gyeonggi-do", "Gyeonggi Province"],
    "강원": ["강원", "강원특별자치도", "Gangwon", "Gangwon-do", "Gangwon Province"],
    "충북": ["충북", "충청북도", "Chungbuk", "Chungcheongbuk-do", "North Chungcheong"],
    "충남": ["충남", "충청남도", "Chungnam", "Chungcheongnam-do", "South Chungcheong"],
    "전북": ["전북", "전북특별자치도", "Jeonbuk", "Jeollabuk-do", "North Jeolla"],
    "전남": ["전남", "전라남도", "Jeonnam", "Jeollanam-do", "South Jeolla"],
    "경북": ["경북", "경상북도", "Gyeongbuk", "Gyeongsangbuk-do", "North Gyeongsang"],
    "경남": ["경남", "경상남도", "Gyeongnam", "Gyeongsangnam-do", "South Gyeongsang"],
    "제주": ["제주", "제주도", "제주특별자치도", "Jeju", "Jeju-do", "Jeju Island"],
}


# -----------------------------
# 아주 러프한 지역 bbox(경계는 대략적, 필요시 실제 행정경계로 교체)
# -----------------------------

REGION_BBOX = {
    # 광역시/특별시/특별자치시
    "서울": (126.76, 37.40, 127.18, 37.70),
    "부산": (128.80, 35.02, 129.33, 35.40),
    "대구": (128.27, 35.62, 128.78, 36.03),
    "인천": (126.03, 37.25, 126.88, 37.78),
    "광주": (126.70, 35.02, 127.05, 35.27),
    "대전": (127.20, 36.22, 127.50, 36.46),
    "울산": (129.08, 35.30, 129.45, 35.69),
    "세종": (127.16, 36.42, 127.36, 36.63),
    "세종특별자치시": (127.16, 36.42, 127.36, 36.63),
    # 도(특별자치도 포함)
    "경기": (126.36, 36.90, 127.95, 38.30),
    "강원": (127.00, 37.00, 129.33, 38.62),
    "강원특별자치도": (127.00, 37.00, 129.33, 38.62),
    "충북": (127.20, 36.00, 128.33, 37.30),
    "충남": (126.05, 36.10, 127.50, 36.98),
    "전북": (126.34, 35.35, 127.65, 36.07),
    "전북특별자치도": (126.34, 35.35, 127.65, 36.07),
    "전남": (125.05, 34.00, 127.40, 35.31),
    "경북": (128.00, 35.55, 129.50, 37.50),
    "경남": (127.40, 34.64, 129.35, 35.93),
    "제주": (126.04, 33.11, 126.98, 33.62),
    "제주특별자치도": (126.04, 33.11, 126.98, 33.62),
}


# -----------------------------
# 지역 문자열 정규화
# -----------------------------
def _normalize_region(value: str) -> str:
    """'서울특별시', 'Seoul City' → '서울' 형태로 정규화"""
    s = str(value).lower()
    s = re.sub(r"(특별|광역|자치)?(시|도|군|구)$", "", s)
    s = s.replace(" city", "").replace("-do", "").replace(" province", "")
    return s.strip()


# -----------------------------
# 질문 내에서 지역명 감지
# -----------------------------
def detect_region_from_question(question: str):
    """REGION_ALIASES 기반으로 지역명을 감지하고 표준화된 지역명 반환"""
    normalized_q = question.lower()
    for region_key, aliases in REGION_ALIASES.items():
        for alias in aliases + [region_key]:
            if alias.lower() in normalized_q:
                return _normalize_region(region_key)
    return None


# -----------------------------
# Elasticsearch용 지역 필터 생성
# -----------------------------
def extract_region_filter(question: str):
    """
    질문에서 지역명 추출 → Elasticsearch bool 쿼리 생성
    ✅ flattened 필드는 wildcard 또는 nested path 사용
    """
    region_name = detect_region_from_question(question)
    if not region_name:
        return None

    aliases = REGION_ALIASES.get(region_name, []) + [region_name]
    should_clauses = []

    for alias in aliases:
        should_clauses.extend(
            [
                # ✅ flattened 필드 전체에서 wildcard 검색 (가장 효과적)
                {"wildcard": {"customFields": f"*{alias}*"}},
                # ✅ 구체적인 경로 (addressRegion, addressLocality)
                {"match": {"customFields.location.addressRegion": alias}},
                {"match": {"customFields.location.addressLocality": alias}},
                {"match_phrase": {"customFields.location.addressRegion": alias}},
                {"match_phrase": {"customFields.location.addressLocality": alias}},
                # ✅ 일반 text 필드
                {"match": {"description": alias}},
                {"match": {"text_all": alias}},
                {"match": {"name": alias}},
                # ✅ keyword 배열
                {"term": {"keywords": alias}},
                {"term": {"subjects": alias}},
                # ✅ owner
                {"match": {"owner": alias}},
            ]
        )

    return {
        "region_name": region_name,
        "bool_clause": {"bool": {"should": should_clauses, "minimum_should_match": 1}},
    }


# -----------------------------
# 메타 모델 정의
# -----------------------------

META_MODEL_MAP = {
    "단일": "SingleDigitalTwin",
    "단일트윈": "SingleDigitalTwin",
    "연합": "FederatedDigitalTwin",
    "연합트윈": "FederatedDigitalTwin",
    "싱글": "SingleDigitalTwin",
    "페더레이티드": "FederatedDigitalTwin",
}


# ==============================
# 시간 표현 파싱
# ==============================
def parse_time_expression(question: str):
    """
    질문에서 시간 표현을 감지하고 Elasticsearch range 쿼리로 변환

    Examples:
        - "최근 디지털트윈" → modificationTime >= (30일 전)
        - "최근 2개월 내" → creationTime >= (2개월 전)
        - "지난주 생성된" → creationTime between (지난주 월요일 ~ 일요일)
        - "2024년 이후" → creationTime > 2024-01-01
        - "2025년 8월 23일 이후" → creationTime >= 2025-08-23T00:00:00
        - "가장 최근 생성된" → creationTime desc 정렬, range 미적용
    """
    now = datetime.now()
    result = {"field": None, "range": {}, "detected": False, "recent_only": False}
    q_lower = question.lower()

    if re.search(r"\bid\s*[=:]", question, re.IGNORECASE):
        print("[TIME][SKIP] ID 기반 질의 감지 → 시간 필터 생략")
        return {"detected": False, "range": {}, "field": None}

    # ============================================================
    # "가장 최근", "최신" → 정렬만 적용 (range는 없음)
    # ============================================================
    if re.search(r"(가장\s*최근|최신)", q_lower):
        result["recent_only"] = True
        result["sort_hint"] = [{"creationTime": "desc"}]
        print("[TIME] '가장 최근/최신' 감지 → 정렬만 적용 (creationTime desc)")
        return result

    # ============================================================
    # 필드 감지
    # ============================================================
    if any(x in q_lower for x in ["생성", "등록", "추가", "작성", "만든"]):
        result["field"] = "creationTime"
    elif any(x in q_lower for x in ["수정", "갱신", "업데이트", "변경"]):
        result["field"] = "modificationTime"
    else:
        result["field"] = "creationTime"

    # ============================================================
    # 절대 날짜 인식 (YYYY-MM-DD or YYYY년 M월 D일)
    # ============================================================
    m = re.search(r"(\d{4})[년\-\s]*(\d{1,2})[월\-\s]*(\d{1,2})[일]?", q_lower)
    if m:
        year, month, day = map(int, m.groups())
        absolute_date = f"{year}-{month:02d}-{day:02d}T00:00:00"
        result["range"]["gte"] = absolute_date
        result["detected"] = True
        print(f"[TIME] 절대 날짜 감지 → {result['field']} >= {absolute_date}")
        return result

    # ============================================================
    # 절대 연/월 표현
    # ============================================================
    if match := re.search(r"(\d{4})\s*년\s*이후", q_lower):
        year = int(match.group(1))
        result["range"]["gte"] = f"{year}-01-01T00:00:00"
        result["detected"] = True
        print(f"[TIME] '{year}년 이후' 감지 → {result['field']} >= {year}-01-01")
        return result

    if match := re.search(r"(\d{4})\s*년\s*(\d{1,2})\s*월\s*이후", q_lower):
        year, month = int(match.group(1)), int(match.group(2))
        result["range"]["gte"] = f"{year}-{month:02d}-01T00:00:00"
        result["detected"] = True
        print(
            f"[TIME] '{year}년 {month}월 이후' 감지 → {result['field']} >= {year}-{month:02d}-01"
        )
        return result

    # ============================================================
    # 상대적 기간 표현 (최근 N개월, 2년 이내 등)
    # ============================================================
    patterns = [
        (r"최근\s*(\d+)\s*일", "days"),
        (r"최근\s*(\d+)\s*주", "weeks"),
        (r"최근\s*(\d+)\s*(개월|달)", "months"),
        (r"최근\s*(\d+)\s*년", "years"),
        (r"(\d+)\s*일\s*(이내|내)", "days"),
        (r"(\d+)\s*주\s*(이내|내)", "weeks"),
        (r"(\d+)\s*(개월|달)\s*(이내|내)", "months"),
        (r"(\d+)\s*년\s*(이내|내)", "years"),
        (r"(\d+)\s*일\s*전", "days"),
        (r"(\d+)\s*주\s*전", "weeks"),
        (r"(\d+)\s*(개월|달)\s*전", "months"),
        (r"(\d+)\s*년\s*전", "years"),
    ]

    for pattern, unit in patterns:
        if m := re.search(pattern, q_lower):
            num = int(m.group(1))
            delta = relativedelta(**{unit: num})
            result["range"]["gte"] = (now - delta).isoformat()
            result["detected"] = True
            print(
                f"[TIME] 상대 기간 감지 → {result['field']} >= {(now - delta).isoformat()}"
            )
            return result

    # “최근” 단독 (기본 30일)
    if re.search(r"최근(?!\s*\d)", q_lower):
        result["range"]["gte"] = (now - relativedelta(days=30)).isoformat()
        result["detected"] = True
        print(f"[TIME] '최근' 감지 → {result['field']} >= 30일 전")
        return result

    # ============================================================
    # 특수 표현
    # ============================================================
    if "지난주" in q_lower or "지난 주" in q_lower:
        weekday = now.weekday()
        last_monday = now - timedelta(days=weekday + 7)
        last_sunday = last_monday + timedelta(days=6)
        result["range"]["gte"] = last_monday.replace(
            hour=0, minute=0, second=0
        ).isoformat()
        result["range"]["lte"] = last_sunday.replace(
            hour=23, minute=59, second=59
        ).isoformat()
        result["detected"] = True
        print(
            f"[TIME] '지난주' 감지 → {result['field']} between {result['range']['gte']} ~ {result['range']['lte']}"
        )
        return result

    if "지난달" in q_lower or "지난 달" in q_lower:
        first_day_this_month = now.replace(day=1)
        last_month_end = first_day_this_month - timedelta(days=1)
        last_month_start = last_month_end.replace(day=1)
        result["range"]["gte"] = last_month_start.isoformat()
        result["range"]["lte"] = last_month_end.isoformat()
        result["detected"] = True
        print(
            f"[TIME] '지난달' 감지 → {result['field']} between {result['range']['gte']} ~ {result['range']['lte']}"
        )
        return result

    if "작년" in q_lower:
        result["range"]["gte"] = f"{now.year - 1}-01-01T00:00:00"
        result["range"]["lte"] = f"{now.year - 1}-12-31T23:59:59"
        result["detected"] = True
        print(f"[TIME] '작년' 감지 → {result['field']} in {now.year - 1}")
        return result

    # ============================================================
    # 명시적 날짜 “이후”, “부터”, “까지”
    # ============================================================
    if match := re.search(r"(\d{4})[-/](\d{1,2})[-/](\d{1,2})\s*(이후|부터)", q_lower):
        y, m, d = map(int, match.groups()[:3])
        result["range"]["gte"] = f"{y}-{m:02d}-{d:02d}T00:00:00"
        result["detected"] = True
        print(
            f"[TIME] 절대 날짜(이후/부터) 감지 → {result['field']} >= {result['range']['gte']}"
        )
        return result

    if match := re.search(r"(\d{4})[-/](\d{1,2})[-/](\d{1,2})\s*까지", q_lower):
        y, m, d = map(int, match.groups()[:3])
        result["range"]["lte"] = f"{y}-{m:02d}-{d:02d}T23:59:59"
        result["detected"] = True
        print(
            f"[TIME] 절대 날짜(까지) 감지 → {result['field']} <= {result['range']['lte']}"
        )
        return result

    return result


# ============================================================
# 시간 필터 보정 (LLM 생성값을 ISO 포맷으로)
# ============================================================
# ============================================================
# 시간 필터 보정 (LLM 생성값을 ISO 포맷으로 변환)
# ============================================================
def _normalize_time_filter(filter_dict):
    """
    LLM이 만든 자연어 날짜("3개월 전", "2년 이내" 등)을 ISO 포맷으로 변환
    - 모든 depth의 dict 순회 지원
    - 변환 성공 시 Elasticsearch range에 바로 사용 가능
    """

    now = datetime.now()

    if not isinstance(filter_dict, dict):
        return filter_dict

    normalized = {}

    for key, value in filter_dict.items():
        # 하위 dict 재귀 처리
        if isinstance(value, dict):
            normalized[key] = _normalize_time_filter(value)

        elif isinstance(value, str):
            match = re.search(r"(\d+)\s*(일|주|개월|달|년)\s*(전|이내|내)?", value)
            if match:
                num = int(match.group(1))
                unit = match.group(2)

                # 단위별 delta
                if unit == "일":
                    delta = relativedelta(days=num)
                elif unit == "주":
                    delta = relativedelta(weeks=num)
                elif unit in ["개월", "달"]:
                    delta = relativedelta(months=num)
                elif unit == "년":
                    delta = relativedelta(years=num)
                else:
                    delta = relativedelta(days=0)

                iso_time = (now - delta).replace(microsecond=0).isoformat()
                normalized[key] = iso_time
                print(f"[TIME][NORMALIZE] '{value}' → '{iso_time}'")
            else:
                normalized[key] = value
        else:
            normalized[key] = value

    return normalized
