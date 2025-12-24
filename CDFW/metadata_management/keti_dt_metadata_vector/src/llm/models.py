from langchain_openai import ChatOpenAI
from langchain_huggingface import HuggingFaceEmbeddings
from config.settings import OPENAI_API_KEY, OPENAI_CHAT_MODEL, EMBEDDING_MODEL_NAME

# 임베딩 모델
embedding_model = HuggingFaceEmbeddings(model_name=EMBEDDING_MODEL_NAME)

# 채팅 모델
llm = ChatOpenAI(api_key=OPENAI_API_KEY, model=OPENAI_CHAT_MODEL, temperature=0.2)
