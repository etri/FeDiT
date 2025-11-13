from typing import Any, Dict, List, Optional, Tuple
from datetime import datetime
from elasticsearch.helpers import bulk

from config.settings import (
    EMBEDDING_MODEL_NAME,
    EMBEDDING_DIMS,
    ES_INDEX_NAME,
    ES_EDGES_INDEX_NAME,
)
from db.elastic import es
from config.utils import now_iso_local

# from jwtutil import get_jwt_payload  # 인증 쓰면 주석 해제

# --------------------------------------------------------
# 유틸

POSTAL_KEYS_ORDER = [
    "addressRegion",  # 시/도
    "addressLocality",  # 시/군/구
    "addressSubLocality",  # 동/읍/면 (있으면)
    "streetAddress",  # 도로명/지번
    "postalCode",  # 우편번호
    "addressCountry",  # KR 등
]

# 행정구역 접미어 정리(선택)
import re

_KO_SUFFIX_RE = re.compile(
    r"(특별자치시|특별자치도|특별시|광역시|자치구|구|시|군|읍|면|동|리)$"
)
REGION_NORMALIZE = {
    "서울특별시": "서울",
    "부산광역시": "부산",
    "대구광역시": "대구",
    "인천광역시": "인천",
    "광주광역시": "광주",
    "대전광역시": "대전",
    "울산광역시": "울산",
    "세종특별자치시": "세종",
    "강원특별자치도": "강원",
    "전북특별자치도": "전북",
    "제주특별자치도": "제주",
}


def _extract_address_dict(d: dict) -> dict | None:
    cf = d.get("customFields") if isinstance(d.get("customFields"), dict) else {}
    # 1) root.address
    if isinstance(d.get("address"), dict):
        return d["address"]
    # 2) customFields.address
    if isinstance(cf.get("address"), dict):
        return cf["address"]
    # 3) 평면 키 조합
    if any(k in cf for k in POSTAL_KEYS_ORDER):
        return {k: cf.get(k) for k in POSTAL_KEYS_ORDER if k in cf}
    return None


def _norm_admin_name(s: str, is_region=False) -> str:
    if not s:
        return ""
    s = s.strip()
    if is_region and s in REGION_NORMALIZE:
        return REGION_NORMALIZE[s]
    # 너무 길면 접미어 제거 (선택적)
    return _KO_SUFFIX_RE.sub("", s)


def _address_compact_text(addr: dict | None, budget: int = 80) -> str:
    if not isinstance(addr, dict):
        return ""
    parts = []
    # 1) 상위 행정구역 우선 (신호 높음)
    region = _norm_admin_name(str(addr.get("addressRegion") or ""), is_region=True)
    locality = _norm_admin_name(str(addr.get("addressLocality") or ""))
    sublocal = _norm_admin_name(str(addr.get("addressSubLocality") or ""))
    street = str(addr.get("streetAddress") or "").strip()
    postal = str(addr.get("postalCode") or "").strip()
    country = str(addr.get("addressCountry") or "").strip()

    for v in (region, locality, sublocal, street, postal):
        if v and v not in parts:
            parts.append(v)
    # KR은 보통 생략, KR이 아니면 넣기
    if country and country != "KR" and country not in parts:
        parts.append(country)

    txt = " ".join(parts).strip()
    if len(txt) <= budget:
        return txt

    # 길면 단계적으로 줄이기: street → sublocal → postal 순서로 제거
    def _drop(val):
        return " ".join([p for p in parts if p != val]).strip()

    if street and len(txt) > budget:
        parts.remove(street)
        txt = " ".join(parts)
    if sublocal and len(txt) > budget:
        parts.remove(sublocal)
        txt = " ".join(parts)
    if postal and len(txt) > budget:
        parts.remove(postal)
        txt = " ".join(parts)

    # 그래도 길면 잘라내기
    if len(txt) > budget:
        txt = txt[: budget - 1] + "…"
    return txt


def _make_embedding_text(d: dict) -> str:
    """embeddingText 우선, 없으면 name/description/subjects/keywords + (있으면) 압축 주소"""
    if d.get("embeddingText"):
        return str(d["embeddingText"])
    name = d.get("name", "") or ""
    desc = d.get("description", "") or ""
    subjects = d.get("subjects") or []
    keywords = d.get("keywords") or []
    if isinstance(subjects, str):
        subjects = [subjects]
    if isinstance(keywords, str):
        keywords = [keywords]

    addr_txt = _address_compact_text(_extract_address_dict(d), budget=80)

    parts = [
        name.strip(),
        desc.strip(),
        " ".join(map(str, subjects)).strip(),
        " ".join(map(str, keywords)).strip(),
    ]
    if addr_txt:  # 주소가 있으면 '짧게'만 붙이기
        parts.append(addr_txt)

    return "\n".join([p for p in parts if p])


def _edge_id(source_id: str, prpty: str, target_id: str) -> str:
    return f"{source_id}::{prpty}::{target_id}"


def _build_down_edges(
    me_id: str,
    me_type: Optional[str],
    me_model: Optional[str],
    items: List[Dict[str, Any]],
) -> Dict[str, Dict[str, Any]]:
    """
    down(나→자식). 요청 item 스키마:
      { prptyNm, targetId, targetMetaTypeModel, targetMetaModel, edgeProps? }
    """
    desired: Dict[str, Dict[str, Any]] = {}
    now = now_iso_local()
    for it in items or []:
        prp_nm = it.get("prptyNm")
        tgt_id = it.get("targetId")
        if not prp_nm or not tgt_id:
            continue
        edge_id = _edge_id(me_id, prp_nm, tgt_id)
        desired[edge_id] = {
            "edgeId": edge_id,
            "prptyNm": prp_nm,
            "sourceId": me_id,
            "sourceMetaTypeModel": me_type,
            "sourceMetaModel": me_model,
            "targetId": tgt_id,
            "targetMetaTypeModel": it.get("targetMetaTypeModel"),
            "targetMetaModel": it.get("targetMetaModel"),
            "_createdAt_for_upsert": now,
            "updatedAt": now,
            "edgeProps": it.get("edgeProps") or None,
        }
    return desired


def _build_up_edges(
    me_id: str,
    me_type: Optional[str],
    me_model: Optional[str],
    items: List[Dict[str, Any]],
) -> Dict[str, Dict[str, Any]]:
    """
    up(부모→나). upSetList 아이템:
      { upSetId, upPrptyNm, upTypeModelId, upModelId, ... }
    """
    desired: Dict[str, Dict[str, Any]] = {}
    now = now_iso_local()
    for it in items or []:
        src_id = it.get("upSetId")
        prp_nm = it.get("upPrptyNm")
        if not src_id or not prp_nm:
            continue
        edge_id = _edge_id(src_id, prp_nm, me_id)
        desired[edge_id] = {
            "edgeId": edge_id,
            "prptyNm": prp_nm,
            "sourceId": src_id,
            "sourceMetaTypeModel": it.get("upTypeModelId"),
            "sourceMetaModel": it.get("upModelId"),
            "targetId": me_id,
            "targetMetaTypeModel": me_type,
            "targetMetaModel": me_model,
            "_createdAt_for_upsert": now,
            "updatedAt": now,
            "edgeProps": it.get("edgeProps") or None,
        }
    return desired


def _bulk_upsert_edges(desired: Dict[str, Dict[str, Any]]) -> Tuple[int, int]:
    """(성공개수, 총요청개수). createdAt은 upsert에서만 세팅."""
    if not desired:
        return (0, 0)

    def _drop_none(d: Dict[str, Any]) -> Dict[str, Any]:
        return {k: v for k, v in d.items() if v is not None}

    actions: List[Dict[str, Any]] = []
    for edge_id, d in desired.items():
        upsert_doc = _drop_none(
            {
                "edgeId": d["edgeId"],
                "prptyNm": d["prptyNm"],
                "sourceId": d["sourceId"],
                "sourceMetaTypeModel": d.get("sourceMetaTypeModel"),
                "sourceMetaModel": d.get("sourceMetaModel"),
                "targetId": d["targetId"],
                "targetMetaTypeModel": d.get("targetMetaTypeModel"),
                "targetMetaModel": d.get("targetMetaModel"),
                "createdAt": d["_createdAt_for_upsert"],
                "updatedAt": d["updatedAt"],
            }
        )
        doc = _drop_none(
            {
                "prptyNm": d["prptyNm"],
                "sourceId": d["sourceId"],
                "sourceMetaTypeModel": d.get("sourceMetaTypeModel"),
                "sourceMetaModel": d.get("sourceMetaModel"),
                "targetId": d["targetId"],
                "targetMetaTypeModel": d.get("targetMetaTypeModel"),
                "targetMetaModel": d.get("targetMetaModel"),
                "updatedAt": d["updatedAt"],
            }
        )
        actions.append(
            {
                "_op_type": "update",
                "_index": ES_EDGES_INDEX_NAME,
                "_id": edge_id,
                "doc": doc,
                "doc_as_upsert": True,
                "upsert": upsert_doc,
            }
        )

    ok, _ = bulk(es, actions, stats_only=True, request_timeout=60)
    return (ok, len(actions))


def _bulk_delete_edges(edge_ids: List[str]) -> Tuple[int, int]:
    """edge 문서 일괄 삭제."""
    if not edge_ids:
        return (0, 0)
    actions = [
        {"_op_type": "delete", "_index": ES_EDGES_INDEX_NAME, "_id": eid}
        for eid in edge_ids
    ]
    ok, _ = bulk(es, actions, stats_only=True, request_timeout=60)
    return (ok, len(actions))


def _fetch_existing_edge_ids_for_source(source_id: str) -> List[str]:
    """해당 sourceId의 기존 edge_id 목록 (down 프루닝용)"""
    try:
        res = es.search(
            index=ES_EDGES_INDEX_NAME,
            size=10000,
            query={"term": {"sourceId": source_id}},
            _source=False,
        )
        return [h["_id"] for h in res["hits"]["hits"]]
    except Exception:
        return []


def _fetch_existing_edge_ids_for_target(target_id: str) -> List[str]:
    """해당 targetId의 기존 edge_id 목록 (up 프루닝용)"""
    try:
        res = es.search(
            index=ES_EDGES_INDEX_NAME,
            size=10000,
            query={"term": {"targetId": target_id}},
            _source=False,
        )
        return [h["_id"] for h in res["hits"]["hits"]]
    except Exception:
        return []
