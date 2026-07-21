FROM eclipse-temurin:11-jre-jammy

WORKDIR /opt

RUN apt-get update \
 && apt-get install -y wget gettext-base netcat-openbsd \
 && rm -rf /var/lib/apt/lists/*

RUN wget https://archive.apache.org/dist/kafka/2.4.0/kafka_2.11-2.4.0.tgz \
 && tar -xzf kafka_2.11-2.4.0.tgz \
 && mv kafka_2.11-2.4.0 kafka \
 && rm kafka_2.11-2.4.0.tgz

COPY ./docker/kafka/server.properties.template /opt/kafka/config/server.properties.template
COPY ./docker/kafka/docker-entrypoint.sh /docker-entrypoint.sh

RUN chmod +x /docker-entrypoint.sh

WORKDIR /opt/kafka

EXPOSE 9092
EXPOSE 19092

ENTRYPOINT ["/docker-entrypoint.sh"]