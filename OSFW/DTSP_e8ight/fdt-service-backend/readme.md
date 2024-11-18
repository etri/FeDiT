# Backend 서비스 실행 가이드

## fdt-service-backend 디렉터리 이동
```bash
cd fdt-service-backend
cd infra
# MongoDB와 PostgreSQL의 초기 스크립트가 자동 실행됩니다
docker compose up -d docker-compose.yml


cd kafka
docker compose up -d docker-compose-zookeeper.yml
docker compose up -d docker-compose-kafka.yml
docker compose up -d docker-compose-ui.yml

cd ndxpro
docker compose up -d docker-compose-ndxpro.yml
docker compose up -d docker-compose-file.yml
docker compose up -d docker-compose-fdt.yml
