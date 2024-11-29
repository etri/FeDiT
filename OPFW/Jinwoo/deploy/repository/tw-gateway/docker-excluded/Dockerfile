FROM ubuntu:22.04

ENV TZ=Asia/Seoul
RUN apt-get update && \
    apt-get install -y openjdk-17-jdk && \
    apt-get install -y vim net-tools openssh-server curl && \
    apt-get install -yq tzdata && \
    ln -fs /usr/share/zoneinfo/Asia/Seoul /etc/localtime && \
        dpkg-reconfigure -f noninteractive tzdata

COPY ./entrypoint.sh ./

RUN chmod 755 entrypoint.sh