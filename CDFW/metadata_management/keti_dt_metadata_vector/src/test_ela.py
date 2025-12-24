from elasticsearch import Elasticsearch
from config.settings import ES_URL, ES_USERNAME, ES_PASSWORD, ES_INDEX_NAME
from datetime import datetime, timedelta
import json

# ============================================================
# Elasticsearch 연결
# ============================================================
es = Elasticsearch(ES_URL, basic_auth=(ES_USERNAME, ES_PASSWORD))

# ============================================================
# 2년 이내 기준 날짜 계산
# ============================================================
now = datetime.utcnow()
gte_date = (now - timedelta(days=365 * 2)).isoformat()  # 최근 2년 전

print(f"📅 기준일: {gte_date} 이후 생성된 데이터 검색")

# ============================================================
# Elasticsearch range 쿼리
# ============================================================
query = {
    "query": {"range": {"creationTime": {"gte": gte_date}}},
    "sort": [{"creationTime": "desc"}],
    "_source": ["name", "creationTime", "metaTypeModel", "customFields.location"],
}

# ============================================================
# 검색 실행
# ============================================================
res = es.search(index=ES_INDEX_NAME, body=query, size=10)

print(f"🔎 검색된 문서 수: {res['hits']['total']['value']}개\n")

for hit in res["hits"]["hits"]:
    src = hit["_source"]
    print(f"✅ ID: {hit['_id']}")
    print(f"📘 이름: {src.get('name')}")
    print(f"🕒 생성일: {src.get('creationTime')}")
    print(f"🌍 지역: {src.get('customFields', {}).get('location', 'N/A')}")
    print(json.dumps(src, ensure_ascii=False, indent=2))
    print("-" * 80)
