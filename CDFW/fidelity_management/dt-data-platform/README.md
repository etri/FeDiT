# Fidelity


## Installation
- java 
```
1.jdk1.8 다운로드
- https://www.oracle.com/kr/java/technologies/javase/javase8-archive-downloads.html
- jdk-8u202-windows-x64.exe 윈도우 버전 다운로드 및 설치
```

- Spring Tool Suite(sts)
```
1. 다운로드
-최신버전 다운로드
https://spring.io/tools

-개발소스 기준 4.6.0.RELEASE 다운로드
https://github.com/spring-projects/sts4/wiki/Previous-Versions

2. zip 버전 다운로드 및 압축 해제

3. lombok.jar 다운로드
https://projectlombok.org/download
-Java의 라이브러리로 반복되는 메소드를 Annotation 을 사용해서 자동으로 작성해주는 라이브러리이며 현재 소스에서는 @Slf4j를 통해 좀 더 편리하게 로그를 사용하기 위해 사용함
-Spring Tool Suite 압축 해제한 디렉토리로 lombok.jar 파일 이동 후 실행
install/update 버튼 클릭

4. Spring Tool Suite 실행
-wokrspace 디렉토리 지정 후 확인 (git에서 다운받는 디렉토리는 별도 디렉토리로 지정 [ex]git_workspace)
```

- Git source import
```
1. sts Package Explorer 탭 우클릭 > New Gradle Project

2. DT_DATA_PLATFORM 으로 프로젝트 생성

3. git의 CDFW>fidelity_management 의 dt-data-platform 다운로드

4. 생성한 프로젝트 경로에 dt-data-platform 소스 복사

5. YML(환경설정) 정보 수정
-dt-data-platform\DT_DATA_PLATFORM\dt_data_platform_admin\src\main\resources\application.yml
-profiles: local (여러개의 프로픨을 등록 후 배포시 적용할수 있는 옵션)

6. DB 접속 정보 입력(mariadb)
-jdbc-url: jdbc:log4jdbc:mariadb://url
-username: username
-password: password

7. 업로드 및 파일이 생성될 위치 지정
-upload-file-path: /home/files

```

- 소스 배포 방법
```
1.배포용 파일 생성
-프로젝트.jar 파일을 Spring Tool Suite에서 생성
-Gradle Tasks > DT_DATA_PLATFORM > dt_data_platform_admin > build > bootJar 더블클릭
-프로젝트 경로에 dt_data_platform_admin-1.0.jar 파일 생성 확인

2.배포 서버에 dt_data_platform_admin-1.0.jar 파일 업로드

3.실행 명령어
-배포 서버에 JDK가 설치 되어있을경우
nohup java -jar -Dspring.profiles.active=dev -Dserver.port=9102 dt_data_platform_admin-1.0.jar > dt_data_platform.log &

-배포 서버에 JDK가 설치 되어 있지 않을 경우
jdk1.8 압축파일 버전을 다운로드 하여 서버의 원하는 위치에 업로드 후 압축 해제
nohup /home/dt/java/jdk1.8.0_202/bin/java -jar -Dspring.profiles.active=dev -Dserver.port=9102 dt_data_platform_admin-1.0.jar > dt_data_platform.log &

-배포 실행 옵션 설명
nohup 과 & : 백그라운드로 실행하여 서버가 종료되기 전까지는 실행 유지
Dspring.profiles.activ=local' : 등록한 프로필중 선택
Dserver.port=9102 : 사용할 포트 지정

4.프로세스 확인
ps -ef | grep dt_data_platform_admin-1.0.jar 

5.프로세스 삭제
kill -9 process id
```







