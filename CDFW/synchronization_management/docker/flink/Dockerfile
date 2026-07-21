FROM eclipse-temurin:11-jre-jammy

WORKDIR /opt

RUN apt-get update && apt-get install -y wget bash procps netcat && rm -rf /var/lib/apt/lists/*

# 1. Flink 다운로드
RUN wget https://archive.apache.org/dist/flink/flink-1.17.0/flink-1.17.0-bin-scala_2.12.tgz \
 && tar -xzf flink-1.17.0-bin-scala_2.12.tgz \
 && mv flink-1.17.0 flink \
 && rm flink-1.17.0-bin-scala_2.12.tgz

# 2. Flink 라이브러리 복사
COPY ./plugin/flink-lib/ /opt/flink/lib/

# 3. flink-conf.yaml 복사
COPY ./docker/flink/conf/flink-conf.yaml /opt/flink/conf/flink-conf.yaml

# 4. entrypoint 복사
COPY ./docker/flink/docker-entrypoint.sh /opt/flink/docker-entrypoint.sh
RUN chmod +x /opt/flink/docker-entrypoint.sh

# 5. 환경 변수 설정
ENV FLINK_HOME=/opt/flink
ENV PATH=/opt/flink/bin:$PATH

WORKDIR /opt/flink

ENTRYPOINT ["/opt/flink/docker-entrypoint.sh"]