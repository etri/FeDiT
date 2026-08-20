FROM ubuntu:18.04
RUN mkdir -p /root/install
RUN apt-get update

WORKDIR /root/install

#ENV DEBIAN_FRONTEND noninteractive
#ENV JAVA_HOME=/usr/lib/jvm/java-8-openjdk-amd64

RUN apt-get install openjdk-8-jdk -y
RUN apt-get install wget -y
RUN apt-get install vim -y

RUN wget https://archive.apache.org/dist/kafka/2.7.0/kafka_2.13-2.7.0.tgz
RUN tar -zxvf kafka_2.13-2.7.0.tgz
RUN mv kafka_2.13-2.7.0 /usr/local/kafka
RUN mkdir /data

COPY config/init.sh init.sh
RUN sed -i 's/\r//g' init.sh

COPY config/server.properties /usr/local/kafka/config/server.properties
RUN sed -i 's/\r//g' /usr/local/kafka/config/server.properties

CMD bash init.sh
