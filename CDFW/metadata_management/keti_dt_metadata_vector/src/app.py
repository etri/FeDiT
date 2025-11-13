import json
from flask import Flask, request, Response, jsonify
from rag.chain import hybrid_chain  # RAG 검색 체인
from elasticsearch import NotFoundError, ApiError

app = Flask(__name__)
app.config["JSON_AS_ASCII"] = False  # 한글 인코딩 깨짐 방지

from config.settings import (
    EMBEDDING_MODEL_NAME,
    EMBEDDING_DIMS,
    ES_INDEX_NAME,
    ES_EDGES_INDEX_NAME,
)
from typing import Dict, List, Any
from llm.models import embedding_model, llm
from db.elastic import es, save_entity_to_dtmeta_vector  # 저장 함수(매핑 맞춤)
from config.utils import now_iso_local
from db.elestic_data import (
    _extract_address_dict,
    _norm_admin_name,
    _address_compact_text,
    _make_embedding_text,
    _edge_id,
    _build_down_edges,
    _build_up_edges,
    _bulk_upsert_edges,
    _bulk_delete_edges,
    _fetch_existing_edge_ids_for_source,
    _fetch_existing_edge_ids_for_target,
)

# from config.jwtutil import get_jwt_payload  # 인증 쓰면 주석 해제


# --------------------------------------------------------
# Health Check
# --------------------------------------------------------
@app.route("/health", methods=["GET"])
def health():
    """서버 상태 확인용"""
    return "ok", 200


# --------------------------------------------------------
# RAG 검색 API
# --------------------------------------------------------
@app.route("/vectors/search", methods=["POST"])
def search_vector():
    """
    사용자의 자연어 질의를 입력받아,
    Elasticsearch + LLM 기반으로 디지털트윈 메타데이터를 검색합니다.

    요청 형식:
      POST /vectors/search
      {
          "question": "서울의 최근 1개월 디지털트윈 찾아줘"
      }

    응답 형식:
      {
          "query": {...},                # LLM이 생성한 검색 JSON
          "answer_json": {...},          # (선택) LLM 구조화 응답
          "answer_text": "...",          # LLM 자연어 설명 (표 포함)
      }
    """
    try:
        body = request.get_json(force=True) or {}
        question = body.get("question", "").strip()

        if not question:
            payload = json.dumps(
                {
                    "error": "missing_question",
                    "message": "검색 질문(question)이 비어 있습니다.",
                },
                ensure_ascii=False,
            )
            return Response(
                payload, status=400, mimetype="application/json; charset=utf-8"
            )

        print(f"[INFO] 검색 요청: {question}")
        result = hybrid_chain(question)

        payload = json.dumps(result, ensure_ascii=False)
        return Response(payload, status=200, mimetype="application/json; charset=utf-8")

    except Exception as e:
        print(f"[ERROR] search_vector failed: {e}")
        payload = json.dumps(
            {"error": "internal_error", "message": str(e)}, ensure_ascii=False
        )
        return Response(payload, status=500, mimetype="application/json; charset=utf-8")


# --------------------------------------------------------
# 엔티티 + 엣지를 한 번에 업서트
# --------------------------------------------------------


@app.route("/vectors/<medataSetId>", methods=["PUT"])
def upsert_vector(medataSetId):
    # payload, error_response, status = get_jwt_payload()
    # if error_response:
    #     return error_response, status

    entity_id = medataSetId
    body: Dict[str, Any] = request.get_json(force=True) or {}

    # 1) 임베딩 생성
    emb_text = _make_embedding_text(body)
    model = embedding_model
    embedding = model.encode(emb_text).tolist()
    if len(embedding) != EMBEDDING_DIMS:
        return jsonify({"error": f"embedding dim must be {EMBEDDING_DIMS}"}), 400

    # 2) 엔티티 저장 (dtmeta_vector)
    entity = {
        "id": entity_id,
        "metaTypeModel": body.get("metaTypeModel"),
        "metaModel": body.get("metaModel"),
        "metaTypeModelIdField": body.get("metaTypeModelIdField"),
        "name": body.get("name"),
        "description": body.get("description"),
        "subjects": body.get("subjects"),
        "keywords": body.get("keywords"),
        "subjects_text": body.get("subjects") or [],
        "keywords_text": body.get("keywords") or [],
        "owner": body.get("owner"),
        "creator": body.get("creator"),
        "statusCode": body.get("statusCode"),
        "statusName": body.get("statusName"),
        "creationTime": body.get("creationTime"),
        "modificationTime": body.get("modificationTime"),
        "countryCode": body.get("countryCode"),
        "classificationTypeCode": body.get("classificationTypeCode"),
        "classificationCode": body.get("classificationCode"),
        "geometry": body.get("geometry"),
        "geometryCentroid": body.get("geometryCentroid"),
        "customFields": body.get("customFields", {}),
        "content": emb_text,  # 저장용 content
        "embedding": embedding,  # ← 이건 반드시 값 있어야 함 (384차원)
    }

    try:
        save_entity_to_dtmeta_vector(entity)
    except ApiError as e:
        return jsonify({"error": f"ES entity index error: {e}"}), 500

    # 3) 관계 저장
    down_items: List[Dict[str, Any]] = body.get("edgeList") or []  # 나 → 자식
    up_items: List[Dict[str, Any]] = body.get("upSetList") or []  # 부모 → 나

    desired_down = _build_down_edges(
        entity_id, body.get("metaTypeModel"), body.get("metaModel"), down_items
    )
    desired_up = _build_up_edges(
        entity_id, body.get("metaTypeModel"), body.get("metaModel"), up_items
    )

    upserted_down = upserted_up = 0
    if desired_down:
        ok, _ = _bulk_upsert_edges(desired_down)
        upserted_down = ok
    if desired_up:
        ok, _ = _bulk_upsert_edges(desired_up)
        upserted_up = ok

    # 4) 프루닝(옵션)
    # prune: false (기본) → 이번 요청의 데이터 목록만 추가/업데이트하고, 기존에 있던 다른 엣지들은 그대로 둡니다. (병합/append)
    # prune: true → 이번 요청의 데이터 목록에 없는 것들은 전부 삭제합니다.
    #               즉, 저장 후 결과가 **“이번에 보낸 목록 데이터와 정확히 동일”**이 되게 맞춥니다. (완전 동기화)
    prune_down = bool(body.get("pruneDown"))
    prune_up = bool(body.get("pruneUp"))

    deleted_down = deleted_up = 0
    if prune_down:
        existing = _fetch_existing_edge_ids_for_source(entity_id)
        keep = set(desired_down.keys())
        to_del = list(set(existing) - keep)
        ok, _ = _bulk_delete_edges(to_del)
        deleted_down = ok

    if prune_up:
        existing = _fetch_existing_edge_ids_for_target(entity_id)
        keep = set(desired_up.keys())
        to_del = list(set(existing) - keep)
        ok, _ = _bulk_delete_edges(to_del)
        deleted_up = ok

    return jsonify(
        {
            "status": "ok",
            "entityId": entity_id,
            "downUpserted": upserted_down,
            "downDeleted": deleted_down,
            "upUpserted": upserted_up,
            "upDeleted": deleted_up,
        }
    )


# --------------------------------------------------------
# 엔티티 삭제 (옵션: 관계 동시 삭제)
# --------------------------------------------------------


@app.route("/vectors/<medataSetId>", methods=["DELETE"])
def delete_vector(medataSetId):
    # payload, error_response, status = get_jwt_payload()
    # if error_response:
    #     return error_response, status

    entity_id = medataSetId
    delete_down = request.args.get("deleteDown", "").lower() in ("1", "true", "yes")
    delete_up = request.args.get("deleteUp", "").lower() in ("1", "true", "yes")

    # 1) 엔티티 삭제
    try:
        es.delete(index=ES_INDEX_NAME, id=entity_id)
    except NotFoundError:
        return jsonify({"error": "Document not found", "id": entity_id}), 404

    # 2) 관계 삭제
    down_deleted = up_deleted = 0
    if delete_down:
        ids = _fetch_existing_edge_ids_for_source(entity_id)
        ok, _ = _bulk_delete_edges(ids)
        down_deleted = ok
    if delete_up:
        ids = _fetch_existing_edge_ids_for_target(entity_id)
        ok, _ = _bulk_delete_edges(ids)
        up_deleted = ok

    return jsonify(
        {
            "status": "deleted",
            "id": entity_id,
            "downEdgesDeleted": down_deleted,
            "upEdgesDeleted": up_deleted,
        }
    )
