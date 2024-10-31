* 실행
  * env file 설정
    * /dist/env 폴더의 .env.ref 파일을 참조하여 빌드환경에 맞는 .env 파일을 만든다.
      * DATAINTERFACE_IPADDRESS : data interface의 ip address
        * DATAINTERFACE_IPADDRESS__UPSERT = 'http://192.168.62.152:9131/v1/avro' 
          * -> 개발서버에서 동작중인 data-interface 서비스
          * -> 공공 openapi에서 데이터 수집후 data-interface 서비스로 데이터 전송하고 모두 성공적으로 동작하면 192.168.62.152:33161 mysql db의 parking_lot_status 테이블에 insert 된다.
        * DATAINTERFACE_IPADDRESS__FIND = 'http://192.168.62.152:9131/v1/avro/find'
          * -> db 조회 위한 api
      * OPENAPIKEY_JEJUCITS : 제주자치경찰단 cits openapi key
  * 실행하기
    * local - dev
      1. typescript build 
         * npm run build
      2. run process
         * npm run dev
    * local - prod
      1. typescript build 
         * npm run build
      2. run process
         * npm run prod
    * local - prod.pm
      1. pm2 설치
         * npm i -g pm2 
      2. typescript build 
         * npm run build
      3. run process
         * npm run prod.pm2
    * docker
      * up
        * docker-compose --env-file ./dist/env/.env.production up -d --build
      * down
        * docker-compose --env-file ./dist/env/.env.production down



