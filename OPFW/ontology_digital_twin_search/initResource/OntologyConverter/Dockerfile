FROM eclipse-temurin:17-jre
WORKDIR /app
COPY searchRule-0.0.1-SNAPSHOT.jar app.jar
EXPOSE 8888
ENTRYPOINT ["java", "-jar", "app.jar", "--spring.profiles.active=docker"]