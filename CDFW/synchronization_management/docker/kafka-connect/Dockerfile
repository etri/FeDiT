FROM eclipse-temurin:11-jre-jammy

WORKDIR /opt

RUN apt-get update \
 && apt-get install -y wget gettext-base netcat-openbsd curl \
 && rm -rf /var/lib/apt/lists/*

RUN wget https://archive.apache.org/dist/kafka/2.4.0/kafka_2.11-2.4.0.tgz \
 && tar -xzf kafka_2.11-2.4.0.tgz \
 && mv kafka_2.11-2.4.0 kafka \
 && rm kafka_2.11-2.4.0.tgz

RUN mkdir -p /opt/kafka-connect/plugins /etc/kafka

COPY ./plugin/kafka-connector/ /opt/kafka-connect/plugins/
COPY ./docker/kafka-connect/connect-distributed.properties /etc/kafka/connect-distributed.properties
COPY ./docker/kafka-connect/docker-entrypoint.sh /docker-entrypoint.sh

RUN wget https://jdbc.postgresql.org/download/postgresql-42.5.1.jar \
    -O /opt/kafka/libs/postgresql-42.5.1.jar

RUN chmod +x /docker-entrypoint.sh

WORKDIR /opt/kafka

EXPOSE 8083

ENTRYPOINT ["/docker-entrypoint.sh"]