# Backend 서비스 실행 가이드

.evn 파일 REPO 경로 설정 (volume mount 경로)



## fdt-service-backend 디렉터리 이동


```bash
# docker network 생성 
docker network create ndxpro

cd fdt-service-backend
cd infra
# MongoDB와 PostgreSQL의 초기 스크립트가 자동 실행됩니다
docker compose up -d 


cd kafka
sh install_images.sh
.evn 파일 HOST 변경 (내 서버 host)
docker compose -f docker-compose-zookeeper.yml up -d 
docker compose -f docker-compose-kafka.yml up -d 
docker compose -f docker-compose-ui.yml up -d

docker compose -f docker-compose-ndxpro.yml up -d 
docker compose -f docker-compose-file.yml up -d 
docker compose -f docker-compose-fdt.yml up -d 
