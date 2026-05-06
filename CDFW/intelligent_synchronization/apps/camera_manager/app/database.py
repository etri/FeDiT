from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import os

SQLALCHEMY_DATABASE_URL = os.getenv(
    "DATABASE_URL", 
    "postgresql://dt_admin:dt_password@postgres_db:5432/dt_metadata"
)

# FastAPI 비동기 환경에서 Sync 드라이버(psycopg2)를 사용할 때 Thread 병목 방지를 위한 설정
engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
