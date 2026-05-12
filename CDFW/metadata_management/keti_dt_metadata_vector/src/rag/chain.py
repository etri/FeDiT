import json, re, traceback
from llm.prompt import query_gen_chain, response_prompt, response_prompt_agg
from retriever.elastic_retriever import search_in_elasticsearch, aggregate_search
from llm.models import llm


# ============================================================
# LLM 출력 JSON 정제 유틸
# ============================================================
def clean_llm_json_output(text: str):
    """
    백틱(```json ... ```) 포함 LLM 출력에서 순수 JSON만 추출 및 파싱.
    비정상 JSON도 최대한 복원 시도.
    """
    if not text:
        return None

    # 불필요한 포맷 제거
    text = re.sub(r"^```(?:json)?", "", text.strip(), flags=re.IGNORECASE)
    text = re.sub(r"```$", "", text.strip(), flags=re.MULTILINE)
    text = re.sub(r"(?i)^output\s*:\s*", "", text.strip())
    text = text.strip()

    # JSON 구조 ({...} 또는 [...]) 추출
    match = re.search(r"(\{[\s\S]*\}|\[[\s\S]*\])", text)
    if match:
        text = match.group(1).strip()

    # JSON 파싱
    try:
        return json.loads(text)
    except Exception as e:
        print(f"[WARN] clean_llm_json_output 실패: {e}\n원문: {text[:200]}")
        try:
            return json.loads(text.rstrip(".") + "}")
        except Exception:
            return None


# ============================================================
# RAG 하이브리드 체인 (LLM + Elasticsearch)
# ============================================================
def hybrid_chain(question: str):
    """
    자연어 질문 → LLM 검색 쿼리 생성 → Elasticsearch 검색 → LLM 요약 응답
    - '전체/목록' → match_all 모드 자동
    - 'aggregation' → 집계 검색
    - '키워드' → vector_search 비활성화
    - geo_point, creation/modificationTime 포함
    """
    try:
        print("\n" + "=" * 60)
        print(f"[STEP 1] 사용자 질문: {question}")
        print("=" * 60)

        aggregation_result = None
        geo_points = []

        # ------------------------------------------------------
        # STEP 1-1. 검색 모드 감지
        # ------------------------------------------------------
        lower_q = question.lower()
        force_keyword = any(
            x in lower_q for x in ["키워드", "keyword", "정확히", "필터"]
        )
        print("[MODE]", "키워드 검색 모드" if force_keyword else "벡터 검색 모드")

        # ------------------------------------------------------
        # STEP 1-2. LLM으로 검색용 JSON 쿼리 생성
        # ------------------------------------------------------
        query_response = query_gen_chain.invoke(question)
        print(f"[DEBUG] query_gen_chain.invoke() 반환 타입: {type(query_response)}")

        if isinstance(query_response, dict):
            query_text = query_response.get("text") or query_response.get("content", "")
        elif hasattr(query_response, "content"):
            query_text = query_response.content
        else:
            query_text = str(query_response)

        query_text = (query_text or "").strip()
        print(f"[LLM 출력 원문]\n{query_text}\n")

        # ------------------------------------------------------
        # STEP 1-3. JSON 파싱
        # ------------------------------------------------------
        search_query = clean_llm_json_output(query_text)
        if not search_query:
            print("[WARN] LLM 쿼리 파싱 실패 → 기본 벡터 검색으로 대체")
            search_query = {"vector_search": True, "question": question}

        # ------------------------------------------------------
        # STEP 1-4. 검색 모드 및 match_all 보정
        # ------------------------------------------------------
        if force_keyword:
            search_query["vector_search"] = False
        else:
            search_query["vector_search"] = search_query.get("vector_search", True)

        # 전체 목록 질의 감지
        if any(w in lower_q for w in ["전체", "목록", "전부", "모두", "다 보여줘"]):
            print("[MODE] 전체 목록 요청 감지 → match_all 모드로 전환")
            search_query["match_all"] = True
            search_query["vector_search"] = False
            search_query.setdefault("sort", [{"creationTime": "desc"}])

        # 집계 검색 여부
        is_aggregation = str(search_query.get("aggregation", "")).lower() in [
            "true",
            "1",
        ]
        print("[STEP 1] 최종 검색 쿼리:")
        print(json.dumps(search_query, ensure_ascii=False, indent=2))

        # ------------------------------------------------------
        # STEP 2. Elasticsearch 검색 실행
        # ------------------------------------------------------
        print("=" * 80)
        print("\n[STEP 2] Elasticsearch 검색 실행 중...")
        print("=" * 80)

        docs = []

        try:
            if is_aggregation:
                print("[MODE] 집계 검색 실행")
                search_query["vector_search"] = False
                docs = aggregate_search(search_query)

                if docs and "aggregations" in docs[0]:
                    aggregation_result = docs[0]
                    print(
                        f"[INFO] 집계 결과: total_count = {aggregation_result.get('total_count')}"
                    )
            else:
                docs = search_in_elasticsearch(search_query, question)

                # match_all 모드일 경우 dict로 반환됨 → docs 추출
                if isinstance(docs, dict) and "docs" in docs:
                    total_count = docs.get("total_count", len(docs["docs"]))
                    search_query["total_count"] = total_count
                    docs = docs["docs"]
                    print(
                        f"[INFO] match_all 결과 ({total_count}개 중 {len(docs)}개 표시)"
                    )

        except Exception as e:
            print(f"[ERROR] Elasticsearch 검색 실패: {e}")
            traceback.print_exc()
            docs = []

        # ------------------------------------------------------
        # STEP 2-1. 검색 결과 요약 컨텍스트 구성
        # ------------------------------------------------------
        total_count = search_query.get("total_count", len(docs))

        if aggregation_result:
            total_count = aggregation_result.get("total_count", 0)
            summary = aggregation_result.get("summary", "")
            print(f"[INFO] 집계 결과: {total_count}개")
            context = summary

        elif not docs:
            print("[INFO] 검색 결과가 없습니다.")
            context = "검색 결과 없음"

        else:
            is_vector_mode = search_query.get("vector_search", False)

            print(f"[INFO] {len(docs)}개의 문서를 검색했습니다.")
            context_list = []

            for i, doc in enumerate(docs[:15], 1):
                source = doc.get("_source") or doc
                if not isinstance(source, dict):
                    source = {}

                cf = (
                    source.get("customFields", {})
                    if isinstance(source.get("customFields"), dict)
                    else {}
                )

                doc_id = (
                    cf.get("dtid")
                    or cf.get("sid")
                    or source.get("id")
                    or doc.get("_id")
                    or "정보없음"
                )

                simplified = {
                    "id": doc_id,
                    "name": source.get("name", "정보없음"),
                    "metaTypeModel": source.get("metaTypeModel", "정보없음"),
                    "metaModel": source.get("metaModel", "정보없음"),
                    "description": source.get("description", "정보없음")[:300],
                    "keywords": source.get("keywords", []),
                    "owner": source.get("owner", "정보없음"),
                    "creationTime": source.get("creationTime", "정보없음"),
                    "modificationTime": source.get("modificationTime", "정보없음"),
                    "location": (
                        source.get("customFields", {}).get("location")
                        if isinstance(source.get("customFields"), dict)
                        else "정보없음"
                    ),
                }

                centroid = source.get("geometryCentroid", {})
                if centroid and "lat" in centroid and "lon" in centroid:
                    geo_points.append(
                        {
                            "name": simplified["name"],
                            "lat": centroid["lat"],
                            "lon": centroid["lon"],
                        }
                    )

                context_list.append(
                    f"   ID: {simplified['id']}\n"
                    f"{i}. 이름: {simplified['name']}\n"
                    f"   유형: {simplified['metaModel']}\n"
                    f"   지역: {simplified['location']}\n"
                    f"   생성일: {simplified['creationTime']}\n"
                    f"   수정일: {simplified['modificationTime']}\n"
                    f"   설명: {simplified['description']}\n"
                    f"   키워드: {', '.join(simplified['keywords']) if simplified['keywords'] else '없음'}\n"
                    f"   주제어: {', '.join(source.get('subjects', [])) if source.get('subjects') else '없음'}\n"
                    f"   작성자: {simplified['owner']}\n"
                )

            # 정렬 힌트 표시
            sort_hint = ""
            sort_option = search_query.get("sort", [])
            if sort_option:
                sort_field = list(sort_option[0].keys())[0]
                direction = list(sort_option[0].values())[0]
                sort_hint = f"정렬 기준: {sort_field} ({direction})"
            elif any(
                x in str(search_query) for x in ["creationTime", "modificationTime"]
            ):
                sort_hint = "시간 기반 필터 적용됨"

            # 벡터 검색 여부 판단
            is_vector_mode = search_query.get("vector_search", False)

            # 벡터/키워드 모드에 따라 헤더 문구 분리
            if is_vector_mode:
                header_line = f"{len(docs)}개의 유사 문서를 찾았습니다. {sort_hint}"
            else:
                if total_count > len(docs):
                    header_line = f"총 {total_count}개 문서 중 상위 {len(docs)}개만 표시 ({sort_hint})"
                else:
                    header_line = f"총 {len(docs)}개 문서가 검색되었습니다. {sort_hint}"

            # 나머지 부분 동일
            context = f"{header_line}\n\n" f"{'-'*60}\n" + "\n".join(context_list)

            if len(context) > 6000:
                context = context[:6000] + "\n\n[이하 생략...]"
        # ------------------------------------------------------
        # STEP 3. LLM 응답 생성
        # ------------------------------------------------------
        print("=" * 80)
        print("[STEP 3] LLM 응답 생성 중...")
        print("=" * 80)

        prompt = response_prompt_agg if is_aggregation else response_prompt
        formatted_prompt = prompt.format(question=question, context=context)

        response = llm.invoke(formatted_prompt)
        answer_text = getattr(response, "content", "") or getattr(response, "text", "")
        answer_text = (
            answer_text.strip() if answer_text else "응답 생성에 실패했습니다."
        )

        print(f"[SUCCESS] LLM 응답 생성 완료 (길이: {len(answer_text)}자)")

        # ------------------------------------------------------
        # STEP 4. 결과 반환
        # ------------------------------------------------------
        return {
            "query": search_query,
            "results": docs if not aggregation_result else [aggregation_result],
            "result_count": (
                aggregation_result.get("total_count", len(docs))
                if aggregation_result
                else len(docs)
            ),
            "answer_text": answer_text,
            "is_aggregation": bool(aggregation_result),
            "geo_points": geo_points,
        }

    except Exception as e:
        print(f"[FATAL] hybrid_chain 실행 실패: {e}")
        traceback.print_exc()
        return {
            "query": {},
            "results": [],
            "result_count": 0,
            "answer_text": f"검색 중 오류 발생: {str(e)}",
            "error": str(e),
        }
