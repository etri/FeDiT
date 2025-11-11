# config.py
import os
from dotenv import load_dotenv

# -----------------------------
# 환경 파일 로드
# -----------------------------
env_file = os.getenv("SERVER_ENV", ".env.meta")
load_dotenv(dotenv_path=env_file)

# -----------------------------
# 기본 설정
# -----------------------------
DEFAULT_TZ_NAME = os.getenv("DEFAULT_TZ_NAME", "Asia/Seoul")

# -----------------------------
# Elasticsearch 설정
# -----------------------------
ES_URL = os.getenv("ES_URL", "http://localhost:9200")
ES_USERNAME = os.getenv("ES_USERNAME", "elastic")
ES_PASSWORD = os.getenv("ES_PASSWORD", "")
ES_INDEX_NAME = os.getenv("ES_INDEX_NAME", "dtmeta_vector")
ES_EDGES_INDEX_NAME = os.getenv("ES_EDGES_INDEX_NAME", "dtmeta_edges")

ES_VERIFY_CERTS = os.getenv("ES_VERIFY_CERTS", "false").lower() == "true"
ES_REQUEST_TIMEOUT = int(os.getenv("ES_REQUEST_TIMEOUT", "30"))
ES_MAX_RETRIES = int(os.getenv("ES_MAX_RETRIES", "3"))
ES_RETRY_ON_TIMEOUT = os.getenv("ES_RETRY_ON_TIMEOUT", "true").lower() == "true"

# -----------------------------
# 임베딩 모델 설정 (HuggingFace)
# -----------------------------
EMBEDDING_MODEL_NAME = os.getenv(
    "EMBEDDING_MODEL_NAME", "sentence-transformers/all-MiniLM-L6-v2"  # 기본 모델
)
EMBEDDING_DIMS = int(os.getenv("EMBEDDING_DIMS", "384"))

# -----------------------------
# OpenAI Chat 모델 (LLM)
# -----------------------------
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
OPENAI_CHAT_MODEL = os.getenv("OPENAI_CHAT_MODEL", "gpt-4o-mini")

# -----------------------------
# RAG 검색 관련 설정
# -----------------------------
LLM_SUMMARY_LIMIT = int(
    os.getenv("LLM_SUMMARY_LIMIT", "10")
)  # LLM에 전달할 요약용 문서 수
ES_TOP_K = int(os.getenv("ES_TOP_K", "100"))  # Elasticsearch에서 검색할 최대 문서 수

# -----------------------------
# OAuth / 기타 설정 (선택)
# -----------------------------
OAUTH_PUBLIC_KEY_URL = os.getenv("OAUTH_PUBLIC_KEY_URL", "")


# -----------------------------
# 유틸: 설정 요약 출력
# -----------------------------
def print_config_summary():
    print(f"Timezone       : {DEFAULT_TZ_NAME}")
    print(f"ES_URL         : {ES_URL}")
    print(f"Index          : {ES_INDEX_NAME}")
    print(f"EmbeddingModel : {EMBEDDING_MODEL_NAME} ({EMBEDDING_DIMS}D)")
    print(f"ChatModel      : {OPENAI_CHAT_MODEL}")
    print(f"OAuthKeyURL    : {OAUTH_PUBLIC_KEY_URL or '(none)'}")


if __name__ == "__main__":
    print_config_summary()
