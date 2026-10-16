# 소스에서 바로 빌드한다. 서버에 JDK/Maven 을 설치할 필요가 없다.
#   docker build -t <이미지명> .

# 1단계: 빌드
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /src
COPY pom.xml .
COPY src ./src

# jar 가 만들어지지 않으면 여기서 바로 실패한다.
RUN mvn -B clean package -DskipTests \
 && ls -l target/*.jar \
 && cp target/*.jar /build.jar

# 2단계: 실행
FROM eclipse-temurin:17-jre-alpine
VOLUME /tmp
WORKDIR /app
COPY --from=build /build.jar app.jar

# 설치 기본 프로필. 실행 시 -e 로 덮어쓸 수 있다.
ENV SPRING_PROFILES_ACTIVE=dev

ENTRYPOINT ["java","-jar","/app/app.jar"]
