* 실행
  * env file 설정
    * /dist/env 폴더의 .env.ref 파일을 참조하여 빌드환경에 맞는 .env 파일을 만든다.
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



