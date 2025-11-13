"""
Elasticsearch client & helpers for dtmeta indices.

- es: 글로벌 Elasticsearch 클라이언트
- reconnect(): gunicorn 포크 이후 재연결
- save_entity_to_dtmeta_vector(entity): dtmeta_vector 매핑에 맞게 업서트 저장
"""

from __future__ import annotations
from typing import Any, Dict, Optional
from elasticsearch import Elasticsearch, ApiError
from config.utils import now_iso_local, to_local_iso
from config.settings import (
    ES_URL,
    ES_USERNAME,
    ES_PASSWORD,
    ES_VERIFY_CERTS,
    ES_INDEX_NAME,
    ES_REQUEST_TIMEOUT,
    ES_MAX_RETRIES,
    ES_RETRY_ON_TIMEOUT,
    EMBEDDING_DIMS,
)

# --------------------------------------
# 글로벌 ES 클라이언트
# --------------------------------------

es: Optional[Elasticsearch] = None


def _create_client() -> Elasticsearch:
    """기본 설정으로 Elasticsearch 클라이언트 생성"""
    return Elasticsearch(
        ES_URL,
        basic_auth=(ES_USERNAME, ES_PASSWORD),
        verify_certs=ES_VERIFY_CERTS,
        request_timeout=ES_REQUEST_TIMEOUT,
        max_retries=ES_MAX_RETRIES,
        retry_on_timeout=ES_RETRY_ON_TIMEOUT,
    )


# 최초 연결
try:
    es = _create_client()
    if not es.ping():
        raise ConnectionError("Elasticsearch 연결 실패: ping 응답 없음")
    print(f"[ES] Connected to {ES_URL}")
except Exception as e:
    print("[ERROR] Elasticsearch 연결 오류:", str(e))
    es = None


def reconnect() -> None:
    """gunicorn preload_app=True에서 포크 후 워커별 재연결에 사용"""
    global es
    try:
        es = _create_client()
        if not es.ping():
            raise ConnectionError("Elasticsearch 재연결 실패: ping 응답 없음")
        print("[ES] Reconnected after fork")
    except Exception as e:
        print("[ERROR] Elasticsearch 재연결 오류:", str(e))
        es = None
        raise


# --------------------------------------
# 유틸 함수
# --------------------------------------

_EMPTY_SENTINELS = (None, "", [], {})


def _drop_empty(d: Dict[str, Any]) -> Dict[str, Any]:
    """None / 빈값 제거"""
    return {k: v for k, v in d.items() if v not in _EMPTY_SENTINELS}


# --------------------------------------
# 엔티티 업서트
# --------------------------------------


def save_entity_to_dtmeta_vector(entity: Dict[str, Any]) -> None:
    """
    dtmeta_vector 매핑에 맞춰 엔티티를 업서트 저장.

    기대 입력 예:
    {
      "id": "...",
      "name": "...",
      "description": "...",
      "content": "...",               # RAG 검색 대상
      "embedding": [...384 floats...],
      "creationTime": "...",
      "modificationTime": "..."
    }
    """
    global es
    if es is None:
        try:
            reconnect()
        except Exception:
            raise RuntimeError("Elasticsearch 클라이언트가 초기화되지 않았습니다.")

    # 필수 필드 검증
    if not entity.get("id"):
        raise ValueError("entity['id']는 필수입니다.")
    if "embedding" not in entity or entity["embedding"] is None:
        raise ValueError("entity['embedding']는 필수입니다.")
    if len(entity["embedding"]) != EMBEDDING_DIMS:
        raise ValueError(
            f"embedding 차원이 {EMBEDDING_DIMS}이어야 합니다. (got={len(entity['embedding'])})"
        )

    # 날짜 정규화 (ISO 포맷으로 변환)
    ct = entity.get("creationTime")
    if isinstance(ct, str) and ct.strip():
        entity["creationTime"] = to_local_iso(ct)
    mt = entity.get("modificationTime")
    if isinstance(mt, str) and mt.strip():
        entity["modificationTime"] = to_local_iso(mt)

    # 문서 조립 (None/빈값 제거)
    doc: Dict[str, Any] = _drop_empty(
        {
            "id": entity["id"],
            "name": entity.get("name"),
            "description": entity.get("description"),
            "content": entity.get("content"),  # 필수
            "embedding": entity["embedding"],  # 필수
            "owner": entity.get("owner"),
            "creator": entity.get("creator"),
            "creationTime": entity.get("creationTime"),
            "modificationTime": entity.get("modificationTime"),
            "indexedAt": now_iso_local(),  # 인덱싱 시각
            "metaTypeModel": entity.get("metaTypeModel"),
            "metaModel": entity.get("metaModel"),
            "statusCode": entity.get("statusCode"),
            "statusName": entity.get("statusName"),
            "keywords": entity.get("keywords"),
            "subjects": entity.get("subjects"),
            "customFields": entity.get("customFields"),
        }
    )

    try:
        es.index(index=ES_INDEX_NAME, id=entity["id"], document=doc)
        print(f"[ES] Upserted document: {entity['id']}")
    except ApiError as e:
        raise RuntimeError(f"ES index API error: {e}") from e
