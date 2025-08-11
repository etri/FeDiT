# 베이스 이미지 선택 (Python 이미지 사용)
FROM python:3.9-slim

# 작업 디렉토리 설정
WORKDIR /app

# Python 의존성 파일 복사
COPY requirements.txt .

# Python 의존성 설치
RUN pip install --no-cache-dir -r requirements.txt

# 애플리케이션 파일 및 모델 파일 복사
COPY jeju_parking_lot_prediction_swagger_server_v3.py .
COPY model/ ./model/

# Flask 서버 포트 노출
EXPOSE 5000

# Flask 애플리케이션 실행
CMD ["python", "jeju_parking_lot_prediction_swagger_server_v3.py"]