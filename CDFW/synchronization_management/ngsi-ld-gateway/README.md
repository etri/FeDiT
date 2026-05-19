# NGSI-LD Gateway Server

## 📌 개요

이 서버는 FederatedTwin(FDT) 플랫폼의 Digital Object 데이터를 조회하여  
NGSI-LD 표준 형식으로 변환하여 제공하는 API 서버입니다.

또한 시뮬레이션 실행 API와 시각화 모델 다운로드 기능을 함께 제공합니다.

---

## 🚀 주요 기능

### 1. NGSI-LD 데이터 변환 API

- GET /ngsi-ld/objects/atmosphere/latest
- GET /ngsi-ld/objects/marine/latest
- GET /ngsi-ld/objects/weather/latest

---

### 2. NGSI-LD Context 제공

- GET /ngsi-ld/context/fdt-pohang-context-v1.0.0.jsonld

---

### 3. 시뮬레이션 실행 API

- POST /api/simulations/run

요청 예시:

```json
{
  "initialState": "normal",
  "condition": "heavy_rain"
}
```

---

### 4. 시각화 모델 다운로드

- GET /api/visual-models/download

---

### 5. 헬스 체크

- GET /health

---

### ⚙️ 실행 방법

```bash
npm install
node ngsi-ld-server.js
```

---

### 🔗 기본 URL

```bash
http://localhost:3001
```
