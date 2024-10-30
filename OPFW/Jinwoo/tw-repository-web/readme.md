* 설정파일 작성
    * 위치 : src/main/resources/config/properties
    * 종류
      * globals-dev.properties : 개발용
      * globals-prod.properties : 실서비스용
      * globals-secret.properties : git에 올리지 말아야할 secret들

* gradle war 빌드 후 war 파일 tw-repository 배포 폴더에 복사해준다. 