1.Spring Tool Suite 4 다운로드
-version: 4.6.0.RELEASE

2.New Gradle Project
-DT_DATA_PLATFORM 으로 프로젝트 생성
-git의 CDFW>fidelity_management 의 dt-data-platform 다운로드
-생성한 프로젝트 경로에 dt-data-platform 소스 복사

3.YML(환경설정) 정보 수정
-dt-data-platform\DT_DATA_PLATFORM\dt_data_platform_admin\src\main\resources\application.yml
profiles: local (여러개의 프로픨을 등록 후 배포시 적용할수 있는 옵션)

-DB 접속 정보 입력(mariadb)
jdbc-url: jdbc:log4jdbc:mariadb://url
username: username
password: password

-업로드 및 파일이 생성될 위치 지정
upload-file-path: /home/files


4.배포용 파일 생성
-프로젝트.jar 파일을 Spring Tool Suite에서 생성
-Gradle Tasks > DT_DATA_PLATFORM > dt_data_platform_admin > build > bootJar 더블클릭
-프로젝트 경로에 dt_data_platform_admin-1.0.jar 파일 생성 확인

5.배포
-배포 서버에 dt_data_platform_admin-1.0.jar 파일 업로드

-배포 서버에 JDK가 설치 되어있을경우
nohup java -jar -Dspring.profiles.active=dev -Dserver.port=9102 dt_data_platform_admin-1.0.jar > dt_data_platform.log &

-배포 서버에 JDK가 설치 되어 있지 않을 경우
:jdk1.8 압축파일 버전을 다운로드 하여 서버의 원하는 위치에 업로드 후 압축 해제
nohup /home/dt/java/jdk1.8.0_202/bin/java -jar -Dspring.profiles.active=dev -Dserver.port=9102 dt_data_platform_admin-1.0.jar > dt_data_platform.log &


6.배포 명령어 설명
:nohup 과 & : 백그라운드로 실행하여 서버가 종료되기 전까지는 실행 유지

:-Dspring.profiles.activ=local' : 등록한 프로필중 선택

:-Dserver.port=9102 : 사용할 포트 지정

:프로세스 조회
ps -ef | grep dt_data_platform_admin-1.0.jar 

:프로세스 삭제
kill -9 process id







