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

    # 전체 문서 수 파악
    body_count = {
        "size": 0,
        "track_total_hits": True,
        "query": {"bool": {"must": []}},
    }

    if "must" in query_dict and isinstance(query_dict["must"], dict):
        for k, v in query_dict["must"].items():
            body_count["query"]["bool"]["must"].append({"term": {k: v}})

    res_total = es.search(index=ES_INDEX_NAME, body=body_count)
    total_count = res_total.get("hits", {}).get("total", {}).get("value", 0)
    print(f"[INFO] 전체 문서 총 {total_count}개")

    #  실제 문서 조회 (최근 생성순 10개)
    size_limit = 10
    body_detail = {
        "size": size_limit,
        "query": {"bool": {"must": []}},
        "sort": sort_option or [{"creationTime": "desc"}],
    }

    if "must" in query_dict and isinstance(query_dict["must"], dict):
        for k, v in query_dict["must"].items():
            body_detail["query"]["bool"]["must"].append({"term": {k: v}})

    res = es.search(index=ES_INDEX_NAME, body=body_detail)
    hits = res.get("hits", {}).get("hits", [])
    docs = [{**h["_source"], "_id": h["_id"]} for h in hits if "_source" in h]

    print(f"[INFO] 최근 생성 순으로 {len(hits)}개 문서를 반환합니다.")

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
    LLM 생성 JSON 기반 Elasticsearch 집계 검색
    """
    try:
        query_dict["filter"] = _normalize_time_filter(query_dict.get("filter", {}))
        must = _build_must_clauses(query_dict.get("must", {}))
        filter_ = _build_filter_clauses(query_dict.get("filter", {}))
        aggs_from_llm = query_dict.get("aggs", None)

        body = {
            "size": 0,
            "query": (
                {"bool": {"must": must, "filter": filter_}}
                if must or filter_
                else {"match_all": {}}
            ),
        }

        # LLM이 직접 aggs를 생성했으면 그대로 사용
        if aggs_from_llm:
            body["aggs"] = aggs_from_llm
        else:
            # 수정: .keyword 제거 (매핑에 이미 keyword 타입)
            body["aggs"] = {
                "group_by_metaTypeModel": {
                    "terms": {
                        "field": "metaTypeModel",  # ← .keyword 제거
                        "size": 1000,
                        "missing": "Unknown",  # ← 누락값 처리
                    },
                    "aggs": {
                        "group_by_metaModel": {
                            "terms": {
                                "field": "metaModel",  # ← .keyword 제거
                                "size": 1000,
                                "missing": "Unknown",
                            }
                        }
                    },
                }
            }

        print("[DEBUG] 최종 집계 body:")
        print(json.dumps(body, ensure_ascii=False, indent=2))

        res = es.search(index=ES_INDEX_NAME, body=body)

        # 디버깅: 실제 ES 응답 확인
        print("[DEBUG] ES 집계 응답:")
        aggs_response = res.get("aggregations", {})
        print(json.dumps(aggs_response, ensure_ascii=False, indent=2))

        # 집계 결과 파싱
        aggs = res.get("aggregations", {})
        results = []

        # group_by_metaTypeModel 처리
        if "group_by_metaTypeModel" in aggs:
            type_buckets = aggs["group_by_metaTypeModel"].get("buckets", [])

            for tb in type_buckets:
                type_name = tb.get("key", "Unknown")
                type_count = tb.get("doc_count", 0)

                results.append(
                    {
                        "aggregation_name": "metaTypeModel",
                        "key": type_name,
                        "count": type_count,
                    }
                )

                # 하위 집계 (metaModel)
                sub_buckets = tb.get("group_by_metaModel", {}).get("buckets", [])
                for sb in sub_buckets:
                    sub_name = sb.get("key", "Unknown")
                    sub_count = sb.get("doc_count", 0)
                    results.append(
                        {
                            "aggregation_name": "metaModel",
                            "parent": type_name,
                            "key": sub_name,
                            "count": sub_count,
                        }
                    )

        # 다른 집계 형식도 처리 (유연성 확보)
        else:
            for agg_name, agg_value in aggs.items():
                if "buckets" in agg_value:
                    for b in agg_value["buckets"]:
                        results.append(
                            {
                                "aggregation_name": agg_name,
                                "key": b.get("key"),
                                "count": b.get("doc_count"),
                            }
                        )
                elif "doc_count" in agg_value:
                    results.append(
                        {
                            "aggregation_name": agg_name,
                            "count": agg_value["doc_count"],
                        }
                    )

        # 총계 계산 (최상위 레벨만)
        if "group_by_metaTypeModel" in aggs:
            root_field = "metaTypeModel"
        elif "group_by_metaModel" in aggs:
            root_field = "metaModel"
        else:
            root_field = None

        if root_field:
            total_count = sum(
                r.get("count", 0)
                for r in results
                if r.get("aggregation_name") == root_field
            )
        else:
            # fallback: 그냥 전체 다 더하기
            total_count = sum(r.get("count", 0) for r in results)

        # summary 생성
        summary_lines = ["- 집계 검색 결과:"]

        if "group_by_metaTypeModel" in aggs:
            type_buckets = aggs["group_by_metaTypeModel"].get("buckets", [])
            for tb in type_buckets:
                type_name = tb.get("key", "Unknown")
                type_count = tb.get("doc_count", 0)
                summary_lines.append(f"  - {type_name}: {type_count}개")

                sub_buckets = tb.get("group_by_metaModel", {}).get("buckets", [])
                for sb in sub_buckets:
                    sub_name = sb.get("key", "Unknown")
                    sub_count = sb.get("doc_count", 0)
                    summary_lines.append(f"    └─ {sub_name}: {sub_count}개")
        else:
            for r in results:
                key = r.get("key", "")
                count = r.get("count", 0)
                summary_lines.append(f"  - {key}: {count}개")

        summary_lines.append(f"\n→ 총계: {total_count}개")
        summary = "\n".join(summary_lines)

        print(summary)

        return [
            {
                "aggregations": results,
                "total_count": total_count,
                "summary": summary,
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
            "size": 50,
            "query": {"bool": bool_query},
            "knn": {
                "field": "embedding",
                "query_vector": embedding,
                "k": 20,
                "num_candidates": 100,
                "filter": {"bool": bool_query},
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
                if field in ["description", "keywords", "subjects"]:
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
