from elasticsearch import Elasticsearch
from llm.models import embedding_model
from config.settings import (
    ES_URL,
    ES_USERNAME,
    ES_PASSWORD,
    ES_INDEX_NAME,
)
from retriever.retriever_utils import (
    extract_region_filter,
    parse_time_expression,
    _normalize_time_filter,
)
import json, traceback, re
from datetime import datetime
from dateutil.parser import parse


# ==========================================================
# Elasticsearch 연결
# ==========================================================
es = Elasticsearch(ES_URL, basic_auth=(ES_USERNAME, ES_PASSWORD))


# ==========================================================
# 메인 검색 엔트리 포인트
# ==========================================================
def search_in_elasticsearch(query_dict: dict, question: str = None):
    """
    LLM이 만든 JSON 쿼리를 실제 Elasticsearch DSL로 변환 후 검색 실행
    - 전체/목록 질의 → match_all 모드
    - 시간/정렬/필터 자동 보정
    - 벡터검색 or 키워드검색 자동 전환
    """

    if "vector_search" not in query_dict:
        query_dict["vector_search"] = True

    lower_q = (question or "").lower()
    sort_option = None

    semantic_keywords = [
        "관련된",
        "유사한",
        "비슷한",
        "주제",
        "의미",
        "관련",
        "연관",
        "동물",
        "환경",
        "스마트시티",
        "에너지",
        "건축",
        "기후",
        "생태",
    ]
    if question and any(word in question for word in semantic_keywords):
        print(f"[FORCE] 의미형 질의 감지 ('{question}') → 벡터 검색 강제 전환")
        query_dict["vector_search"] = True

    # ----------------------------------------------------------
    # [0] ID 기반 질의 감지 → 강제 키워드 검색 전환
    # ----------------------------------------------------------
    if question and re.search(
        r"\bid\s*[=:]\s*['\"]?[\w\-~]+['\"]?", question, re.IGNORECASE
    ):
        print("[FORCE] ID 기반 질의 감지 → 키워드 검색으로 전환 (벡터 비활성화)")
        query_dict["vector_search"] = False

    # ----------------------------------------------------------
    # [1] 전체 목록 질의 감지 ("전체", "목록", "모두" 등)
    # ----------------------------------------------------------
    list_keywords = [
        "전체",
        "목록",
        "모두",
        "전부",
        "전 리스트",
        "전부 보여줘",
        "다 보여줘",
    ]
    if any(word in lower_q for word in list_keywords):
        print("[INFO] 전체 조회 감지 → match_all 모드로 전환")
        query_dict.setdefault("must", {})
        query_dict["match_all"] = True
        query_dict["vector_search"] = False  # 일반 검색 모드 전환

    # ----------------------------------------------------------
    # [2] 질문 기반 정렬 자동 감지
    # ----------------------------------------------------------
    if any(
        x in lower_q for x in ["가장 최근", "최근 생성", "생성된", "등록된", "최신"]
    ):
        sort_option = [{"creationTime": "desc"}]
    elif any(
        x in lower_q for x in ["수정된", "갱신된", "업데이트된", "최근 변경", "최근"]
    ):
        sort_option = [{"modificationTime": "desc"}]
    elif any(x in lower_q for x in ["가장 오래된", "예전에 생성된", "처음 생성된"]):
        sort_option = [{"creationTime": "asc"}]

    # ----------------------------------------------------------
    # [3] LLM 명시 정렬 옵션 반영
    # ----------------------------------------------------------
    if "sort" in query_dict:
        llm_sort = query_dict.pop("sort")
        if isinstance(llm_sort, list):
            sort_option = llm_sort
        elif isinstance(llm_sort, dict):
            sort_option = [{k: v} for k, v in llm_sort.items()]
        print(f"[INFO] LLM 정렬 옵션 감지: {sort_option}")

    if sort_option:
        print(f"[INFO] 정렬 옵션 적용: {sort_option}")

    # ----------------------------------------------------------
    # [4] 시간 필터 자동 보정
    # ----------------------------------------------------------
    query_dict["filter"] = _normalize_time_filter(query_dict.get("filter", {}))

    # ----------------------------------------------------------
    # [4-1] 질문 내 시간 표현 자동 감지 (예: 최근, 3개월, 지난주 등)
    # ----------------------------------------------------------
    try:
        if question:
            time_expr = parse_time_expression(question or "")
            # "가장 최근" 감지 (정렬 전용)
            if time_expr.get("recent_only"):
                print(
                    "[TIME] '가장 최근' 감지 → size=1 + creationTime desc 적용 (range 생략)"
                )
                query_dict["_recent_only"] = True  # 나중에 _keyword_search에서 처리
                if not sort_option:
                    sort_option = [{"creationTime": "desc"}]

            # "최근 3개월", "2년 이내" 등 기간 필터 감지
            elif time_expr.get("detected"):
                field = time_expr.get("field") or "creationTime"
                time_range = time_expr.get("range")
                if time_range:
                    range_filter = {"range": {field: time_range}}
                    query_dict.setdefault("_extra_filters", []).append(range_filter)
                    print(
                        f"[TIME] 감지된 시간 필터 추가 → {json.dumps(range_filter, ensure_ascii=False)}"
                    )

    except Exception as e:
        print(f"[WARN] 시간 표현 감지 실패: {e}")

    # ----------------------------------------------------------
    # [5] 전체 조회(match_all) 처리
    # ----------------------------------------------------------
    if query_dict.get("match_all"):
        return _search_match_all(query_dict, sort_option)

    # ----------------------------------------------------------
    # [6] 일반 검색 실행 (벡터 / 키워드)
    # ----------------------------------------------------------
    if query_dict.get("vector_search") and question:
        print("[INFO] ▶ 벡터 검색 모드 실행")
        return _vector_search(query_dict, question, sort_option)
    else:
        print("[INFO] ▶ 키워드 검색 모드 실행")
        return _keyword_search(query_dict, sort_option, question)


# ==========================================================
# match_all (전체 목록 조회)
# ==========================================================
def _search_match_all(query_dict, sort_option):
    print("[INFO] match_all 쿼리 실행")

    # --------------------------------------------------------
    # [1] must / filter 절 구성
    # --------------------------------------------------------
    must_clauses = _build_must_clauses(query_dict.get("must", {}))

    # 항상 리스트로 초기화 (None 방지)
    filter_clauses = _build_filter_clauses(query_dict.get("filter", {})) or []
    if not isinstance(filter_clauses, list):
        filter_clauses = [filter_clauses]

    # LLM이 감지한 추가 시간 필터(_extra_filters) 병합
    if "_extra_filters" in query_dict:
        extra_filters = query_dict["_extra_filters"]
        if extra_filters:
            print(f"[TIME][APPLY] match_all에 시간 필터 병합: {len(extra_filters)}개")
            filter_clauses.extend(extra_filters)

    # --------------------------------------------------------
    # [2] 전체 문서 수 계산 (필터 포함)
    # --------------------------------------------------------
    body_count = {
        "size": 0,
        "track_total_hits": True,
        "query": {
            "bool": {
                "must": must_clauses,
                "filter": filter_clauses,
            }
        },
    }

    res_total = es.search(index=ES_INDEX_NAME, body=body_count)
    total_count = res_total.get("hits", {}).get("total", {}).get("value", 0)
    print(f"[INFO] 전체 문서 총 {total_count}개")

    # --------------------------------------------------------
    # [3] 실제 문서 조회 (필터 + 정렬 포함)
    # --------------------------------------------------------
    size_limit = 10
    body_detail = {
        "size": size_limit,
        "query": {
            "bool": {
                "must": must_clauses,
                "filter": filter_clauses,
            }
        },
        "sort": sort_option or [{"creationTime": "desc"}],
    }

    res = es.search(index=ES_INDEX_NAME, body=body_detail)
    hits = res.get("hits", {}).get("hits", [])
    docs = [{**h["_source"], "_id": h["_id"]} for h in hits if "_source" in h]

    print(f"[INFO] 필터 적용 후 {len(hits)}개 문서를 반환합니다.")

    return {
        "total_count": total_count,
        "docs": docs,
        "limit": size_limit,
    }


# ==========================================================
#  집계 검색
# ==========================================================


def aggregate_search(query_dict: dict):
    """
    Elasticsearch 집계 검색 - 최종 통합 버전

    지원 기능:
    1) 전체 집계 (metaTypeModel → metaModel)
    2) 특정 metaTypeModel 필터 집계 (Sensor 등)
       - 전체 개수 + 하위 metaModel 개수
    3) 지역(Location) 기반 집계
       - group_by = "location" OR 질문에서 지역 단어 감지 시
    """

    try:
        # 1) 시간 필터 정규화
        query_dict["filter"] = _normalize_time_filter(query_dict.get("filter", {}))

        must_dict = query_dict.get("must", {})
        must = _build_must_clauses(must_dict)
        filter_ = _build_filter_clauses(query_dict.get("filter", {}))

        meta_type_filter = None
        if isinstance(must_dict, dict):
            meta_type_filter = must_dict.get("metaTypeModel")

        group_by = query_dict.get("group_by", None)  # LLM이 직접 설정한 group_by

        base_query = (
            {"bool": {"must": must, "filter": filter_}}
            if must or filter_
            else {"match_all": {}}
        )

        body = {"size": 0, "query": base_query}

        # ============================================================
        # 1) LLM이 직접 aggs 제공
        # ============================================================
        aggs_from_llm = query_dict.get("aggs", None)
        if aggs_from_llm:
            body["aggs"] = aggs_from_llm

        # ============================================================
        # 2) 지역(Location) 집계
        # ============================================================
        elif group_by == "location":
            body["aggs"] = {
                "group_by_region": {
                    "terms": {
                        "field": "customFields.location.addressRegion",
                        "size": 200,
                        "missing": "Unknown",
                    }
                }
            }

        # ============================================================
        # 3) 특정 metaTypeModel 필터 집계 (Sensor 등)
        # ============================================================
        elif meta_type_filter:
            body["aggs"] = {
                # Sensor 전체 개수
                "total_count": {
                    "filter": {"term": {"metaTypeModel": meta_type_filter}},
                    "aggs": {"count_all": {"value_count": {"field": "metaModel"}}},
                },
                # Sensor 하위 metaModel 개수
                "group_by_metaModel": {
                    "terms": {"field": "metaModel", "size": 1000, "missing": "Unknown"}
                },
            }

        # ============================================================
        # 4) 전체 집계
        # ============================================================
        else:
            body["aggs"] = {
                "group_by_metaTypeModel": {
                    "terms": {
                        "field": "metaTypeModel",
                        "size": 1000,
                        "missing": "Unknown",
                    },
                    "aggs": {
                        "group_by_metaModel": {
                            "terms": {
                                "field": "metaModel",
                                "size": 1000,
                                "missing": "Unknown",
                            }
                        }
                    },
                }
            }

        # ------------------------------------------------------------
        # ES 실행
        # ------------------------------------------------------------
        res = es.search(index=ES_INDEX_NAME, body=body)
        aggs = res.get("aggregations", {})

        # ============================================================
        # (A) 지역(Location) 집계 결과 처리
        # ============================================================
        if "group_by_region" in aggs:
            buckets = aggs["group_by_region"]["buckets"]

            results = [{"key": b["key"], "count": b["doc_count"]} for b in buckets]

            total_count = sum(r["count"] for r in results)

            summary_lines = []
            for r in results:
                summary_lines.append(f"- {r['key']}: {r['count']}개")
            summary_lines.append(f"\n→ 총 {total_count}개입니다.")

            return [
                {
                    "aggregations": results,
                    "total_count": total_count,
                    "summary": "\n".join(summary_lines),
                }
            ]

        # ============================================================
        # (B) 특정 metaTypeModel 집계 (Sensor 등)
        # ============================================================
        if meta_type_filter and "group_by_metaModel" in aggs:
            total_count = aggs["total_count"]["count_all"]["value"]

            results = [
                {
                    "aggregation_name": "metaModel",
                    "key": b["key"],
                    "count": b["doc_count"],
                }
                for b in aggs["group_by_metaModel"]["buckets"]
            ]

            summary_lines = [f"{meta_type_filter}: {total_count}개"]
            for r in results:
                summary_lines.append(f"  └─ {r['key']}: {r['count']}개")
            summary_lines.append(f"\n→ 총 {total_count}개입니다.")

            return [
                {
                    "aggregations": results,
                    "total_count": total_count,
                    "summary": "\n".join(summary_lines),
                }
            ]

        # ============================================================
        # (C) 전체 집계 처리
        # ============================================================
        results_all = []
        if "group_by_metaTypeModel" in aggs:
            for tb in aggs["group_by_metaTypeModel"]["buckets"]:

                type_name = tb["key"]
                type_count = tb["doc_count"]

                results_all.append(
                    {
                        "aggregation_name": "metaTypeModel",
                        "key": type_name,
                        "count": type_count,
                    }
                )

                for sb in tb["group_by_metaModel"]["buckets"]:
                    results_all.append(
                        {
                            "aggregation_name": "metaModel",
                            "parent": type_name,
                            "key": sb["key"],
                            "count": sb["doc_count"],
                        }
                    )

        total_count = sum(
            r["count"] for r in results_all if r["aggregation_name"] == "metaTypeModel"
        )

        summary = []
        for r in results_all:
            if r["aggregation_name"] == "metaTypeModel":
                summary.append(f"- {r['key']}: {r['count']}개")
                for x in results_all:
                    if x.get("parent") == r["key"]:
                        summary.append(f"    └─ {x['key']}: {x['count']}개")
        summary.append(f"\n→ 총 {total_count}개입니다.")

        return [
            {
                "aggregations": results_all,
                "total_count": total_count,
                "summary": "\n".join(summary),
            }
        ]

    except Exception as e:
        print(f"[ERROR] 집계 검색 실패: {e}")
        traceback.print_exc()
        return []


# ==========================================================
#  벡터 검색
# ==========================================================
def _vector_search(query_dict: dict, question: str, sort_option=None):
    try:
        embedding = embedding_model.embed_query(question)
        must = _build_must_clauses(query_dict.get("must", {}))
        filter_ = _build_filter_clauses(query_dict.get("filter", {}))

        # 지역 필터 자동 추가
        region_filter = extract_region_filter(question)
        if region_filter:
            region_name = region_filter["region_name"]
            region_bool = region_filter["bool_clause"]
            print(
                f"[INFO] 지역 '{region_name}' 필터 추가 (keywords, subjects, description, owner 포함)"
            )
            must.append(region_bool)

        # 최종 bool 쿼리 구성
        bool_query = {"must": must or [], "filter": filter_ or []}

        body = {
            "size": 100,
            "knn": {
                "field": "embedding",
                "query_vector": embedding,
                "k": 30,
                "num_candidates": 100,
                "filter": {"bool": bool_query},
            },
            "query": {
                "bool": {
                    "should": [
                        {"match": {"text_all": {"query": question, "boost": 2.0}}},
                        {"match": {"description": question}},
                        {"match": {"keywords_text": question}},
                    ],
                    "minimum_should_match": 1,
                }
            },
        }

        if sort_option:
            body["sort"] = sort_option

        res = es.search(index=ES_INDEX_NAME, body=body)
        hits = res.get("hits", {}).get("hits", [])
        print(f"[INFO] {len(hits)}개의 문서를 찾았습니다.")
        return [
            {**h["_source"], "_score": h.get("_score"), "_id": h["_id"]} for h in hits
        ]
    except Exception as e:
        print(f"[ERROR] 벡터 검색 실패: {e}")
        traceback.print_exc()
        return []


# ==========================================================
# 키워드 검색 (시간 필터 + 가장 최근 지원 완전 버전)
# ==========================================================
def _keyword_search(query_dict: dict, sort_option=None, question: str = None):
    """
    키워드 기반 Elasticsearch 검색
    - 기존 match / wildcard / term 검색 구조 유지
    - 시간 표현("최근", "N개월", "2024년 이후") → range 필터 직접 반영
    - "가장 최근"은 size=1 + creationTime desc 정렬
    - Python 후처리 제거 (ES 레벨에서 처리)
    """
    try:
        must_clauses = _build_must_clauses(query_dict.get("must", {}))
        filter_clauses = _build_filter_clauses(query_dict.get("filter", {}))

        print(f"[DEBUG] must_clauses: {len(must_clauses)}개")
        print(f"[DEBUG] filter_clauses: {len(filter_clauses)}개")

        # ==========================================================
        # [1] 지역 필터 자동 추가
        # ==========================================================
        region_in_query = any(
            "customFields.location" in str(clause)
            or ("bool" in clause and "should" in clause.get("bool", {}))
            for clause in (must_clauses + filter_clauses)
        )

        if not region_in_query and question:
            region_filter = extract_region_filter(question)
            if region_filter:
                print(f"[INFO] 지역 필터 자동 추가: {region_filter['region_name']}")
                filter_clauses.append(region_filter["bool_clause"])

        # ==========================================================
        # [2] 시간 표현 감지 → range 필터 추가
        # ==========================================================
        time_expr = parse_time_expression(question or "")
        if time_expr.get("detected"):
            field = time_expr.get("field", "creationTime")
            range_dict = time_expr.get("range", {})

            gte_val = range_dict.get("gte")
            lte_val = range_dict.get("lte")

            def _fix_timezone(v):
                if not v:
                    return None
                if v.endswith("Z"):
                    return v.replace("Z", "+09:00")
                if not any(x in v for x in ["+", "-"]):
                    return v + "+09:00"
                return v

            range_body = {}
            if gte_val:
                range_body["gte"] = _fix_timezone(gte_val)
            if lte_val:
                range_body["lte"] = _fix_timezone(lte_val)

            range_body["time_zone"] = "+09:00"

            range_filter = {"range": {field: range_body}}
            filter_clauses.append(range_filter)

            print(
                f"[TIME] 감지된 시간 필터 추가 → {json.dumps(range_filter, ensure_ascii=False)}"
            )

        # ==========================================================
        # [3] "가장 최근" 감지 시 size=1 + desc 정렬
        # ==========================================================
        size_limit = 50
        if query_dict.get("_recent_only"):
            size_limit = 1
            if not sort_option:
                sort_option = [{"creationTime": "desc"}]
            print("[TIME] '가장 최근' 감지 → size=1 + creationTime desc 적용")

        # ==========================================================
        # [4] LLM이 생성한 should 절 감지 및 병합
        # ==========================================================
        has_complete_filter = any(
            isinstance(clause, dict)
            and "bool" in clause
            and "should" in clause.get("bool", {})
            and clause["bool"]["should"]
            for clause in filter_clauses
        )

        if has_complete_filter:
            print("[INFO] filter를 should로 변환 (스코어 기반 검색)")
            all_should = []
            for clause in filter_clauses:
                if "bool" in clause and "should" in clause.get("bool", {}):
                    all_should.extend(clause["bool"]["should"])
                else:
                    all_should.append(clause)
        else:
            # 키워드 추출 (match, term 값)
            keywords = []
            for clause in must_clauses + filter_clauses:
                if "match" in clause:
                    keywords.extend(list(clause["match"].values()))
                elif "term" in clause:
                    keywords.extend(list(clause["term"].values()))
            if question and not keywords:
                keywords.append(question)

            print(f"[DEBUG] 추출된 키워드: {keywords}")

            all_should = []
            for kw in keywords:
                if not kw:
                    continue
                # 기존 검색 패턴 유지
                all_should.extend(
                    [
                        {"match": {"text_all": {"query": kw, "boost": 2.0}}},
                        {"match": {"description": kw}},
                        {"match": {"name": kw}},
                        {"match": {"content": kw}},
                        {"term": {"keywords": {"value": kw, "boost": 1.5}}},
                        {"term": {"subjects": kw}},
                        {"match_phrase": {"text_all": kw}},
                        {"wildcard": {"customFields": f"*{kw}*"}},
                    ]
                )

        # ==========================================================
        # [5] Elasticsearch body 생성
        # ==========================================================
        body = {
            "size": size_limit,
            "query": {
                "bool": {
                    "must": must_clauses,
                    "should": all_should,
                    "filter": filter_clauses,
                    "minimum_should_match": 1,
                }
            },
        }

        if sort_option:
            body["sort"] = sort_option

        print("[DEBUG] 최종 Elasticsearch 쿼리 body:")
        print(json.dumps(body, ensure_ascii=False, indent=2))

        # ==========================================================
        # [6] Elasticsearch 검색 실행
        # ==========================================================
        res = es.search(index=ES_INDEX_NAME, body=body)
        hits = res["hits"]["hits"]
        total = res["hits"]["total"]["value"]
        print(f"[INFO] {len(hits)}개의 문서를 검색했습니다. (total: {total})")

        return [
            {**h["_source"], "_score": h.get("_score"), "_id": h["_id"]} for h in hits
        ]

    except Exception as e:
        print(f"[ERROR] 키워드 검색 실패: {e}")
        traceback.print_exc()
        return []


# ==========================================================
# _build_must_clauses
# ==========================================================
def _build_must_clauses(must_dict: dict):
    """
    must 절 빌더 (개선 버전)
    - flattened 필드 처리 개선
    - keyword 필드 자동 처리
    """
    clauses = []
    if not must_dict:
        return clauses

    # list 처리
    if isinstance(must_dict, list):
        for sub in must_dict:
            clauses.extend(_build_must_clauses(sub))
        return clauses

    # 이미 완성된 bool 쿼리는 그대로 반환
    if isinstance(must_dict, dict) and "bool" in must_dict:
        return [must_dict]

    keyword_fields = {
        "name",
        "metaTypeModel",
        "metaModel",
        "owner",
        "creator",
        "statusCode",
        "statusName",
        "countryCode",
        "classificationTypeCode",
        "classificationCode",
    }

    for k, v in must_dict.items():
        if not v:
            continue

        # customFields.* 처리 (flattened 필드)
        if k.startswith("customFields."):
            field_name = k.split(".", 1)[1]
            # flattened 필드는 match_phrase가 가장 안전
            clauses.append({"match_phrase": {k: v}})
            print(f"[INFO] Flattened 필드 감지: {k} → match_phrase 사용")
            continue

        # range 처리
        if isinstance(v, dict) and any(op in v for op in ["gte", "lte", "gt", "lt"]):
            clauses.append({"range": {k: v}})
            continue

        # keyword 필드는 term 쿼리
        if k in keyword_fields:
            clauses.append({"term": {k: v}})
            continue

        # 일반 텍스트 필드는 match
        clauses.append({"match": {k: v}})

    return clauses


# ==============================
# _build_filter_clauses
# ==============================
def _build_filter_clauses(filter_dict: dict):
    """
    filter 절 빌더 (강화 버전)
    - 기존 text_all 중심 검색 강화 로직 유지
    - bool.should + range(시간 필터) 동시 지원
    - customFields, description, keywords 등 필드별 처리 포함
    """
    clauses = []
    if not filter_dict:
        return clauses

    # ==========================================================
    # bool.should + range 동시 존재하는 경우
    # ==========================================================
    if "bool" in filter_dict and "should" in filter_dict["bool"]:
        should_clauses = filter_dict["bool"]["should"]
        enhanced_should = []
        seen_values = set()

        for clause in should_clauses:
            if "match" in clause:
                field = list(clause["match"].keys())[0]
                value = clause["match"][field]
                if value in seen_values:
                    continue
                seen_values.add(value)

                # customFields 처리
                if "customFields" in field or "location" in field:
                    print(f"[FIX] customFields 검색 강화: {field} = {value}")
                    enhanced_should.extend(
                        [
                            {"wildcard": {"customFields": f"*{value}*"}},
                            {"match": {"text_all": {"query": value, "boost": 2.0}}},
                            {"match": {"description": value}},
                            {"match": {"name": value}},
                            {"term": {"keywords": value}},
                        ]
                    )
                    continue

                # 일반 match 필드
                if field in ["description", "keywords", "subjects", "name"]:
                    enhanced_should.extend(
                        [
                            {"match": {"text_all": {"query": value, "boost": 2.0}}},
                            {"match": {field: value}},
                            (
                                {"term": {field: value}}
                                if field in ["keywords", "subjects"]
                                else None
                            ),
                        ]
                    )
                    enhanced_should = [s for s in enhanced_should if s]
                    continue

            # 나머지는 그대로 유지
            enhanced_should.append(clause)

        # range 필터 병합
        for k, v in filter_dict.items():
            if k == "bool":
                continue
            if isinstance(v, dict) and any(
                op in v for op in ["gte", "lte", "gt", "lt"]
            ):
                print(f"[TIME][FIX] range 필터 병합: {k} = {v}")
                clauses.append({"range": {k: v}})

        # 중복 제거
        unique_should = []
        seen = set()
        for clause in enhanced_should:
            clause_str = json.dumps(clause, sort_keys=True)
            if clause_str not in seen:
                seen.add(clause_str)
                unique_should.append(clause)

        clauses.append({"bool": {"should": unique_should, "minimum_should_match": 1}})
        return clauses

    # ==========================================================
    # 단일 match / term / range
    # ==========================================================
    if any(k in filter_dict for k in ["match", "term", "range", "match_phrase"]):
        return [filter_dict]

    # ==========================================================
    # 일반 필드 처리
    # ==========================================================
    keyword_fields = {
        "name",
        "metaTypeModel",
        "metaModel",
        "owner",
        "creator",
        "statusCode",
        "statusName",
        "countryCode",
        "classificationTypeCode",
        "classificationCode",
    }

    for k, v in filter_dict.items():
        if not v:
            continue

        # 중첩된 bool 구조
        if k == "bool":
            return [filter_dict]

        # customFields.* 처리
        if k.startswith("customFields."):
            print(f"[INFO] customFields 필드 감지: {k} = {v}")
            clauses.append(
                {
                    "bool": {
                        "should": [
                            {"wildcard": {"customFields": f"*{v}*"}},
                            {"match": {k: v}},
                            {"match_phrase": {k: v}},
                        ],
                        "minimum_should_match": 1,
                    }
                }
            )
            continue

        # range (시간 필터)
        if isinstance(v, dict) and any(op in v for op in ["gte", "lte", "gt", "lt"]):
            print(f"[TIME] range 필터 추가: {k} = {v}")
            clauses.append({"range": {k: v}})
            continue

        # list → terms
        if isinstance(v, list):
            clauses.append({"terms": {k: v}})
            continue

        # keyword 필드
        if k in keyword_fields:
            clauses.append({"term": {k: v}})
