# fdt-service-backend

DB · Kafka · NDXPro 코어 · 파일 서비스 · FDT 뷰어.

환경변수는 상위 디렉터리의 `.env` 를 쓴다. 전체 설치 안내는 [../README.md](../README.md).

```bash
./install/0-init.sh     # 네트워크·디렉터리 생성, 레지스트리 로그인, 이미지 받기
./install/1-db.sh       # PostgreSQL / MongoDB / Redis
./install/2-kafka.sh    # Zookeeper / Kafka   (최초 1회 이미지 빌드)
./install/3-ndxpro.sh   # NDXPro 코어 + 파일 서비스 + FDT 뷰어
./scripts/health.sh     # 확인
./install/9-clean.sh --data   # 전부 내리고 데이터까지 삭제
```

| 폴더 | 내용 |
|---|---|
| `db/` | PostgreSQL·MongoDB·Redis compose 와 최초 기동 시 실행되는 초기화 스크립트 |
| `kafka/` | Kafka·Zookeeper compose 와 이미지 빌드 소스(`build/`) |
| `ndxpro/` | 코어 9개(`compose.yml`), 파일 서비스, FDT 뷰어. `ngsi-context/` 에 @context 파일을 넣는다 |
| `scripts/` | bootstrap(네트워크·디렉터리) · health(검증) · check-images(이미지 점검) · images-load(묶음 적재) · backup(DB 덤프) · remake_container(단일 교체) |
