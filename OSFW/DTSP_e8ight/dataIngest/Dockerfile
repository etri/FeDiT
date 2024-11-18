FROM openjdk:11
MAINTAINER JeongIn Lee <rockintuna@e8ight.co.kr>

# set Time Zone
ENV TZ=Asia/Seoul
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

ARG MIRROR=https://dlcdn.apache.org/flume
ARG VERSION=1.11.0
ARG BIN_VERSION=apache-flume-${VERSION}

RUN apt-get update && apt-get install wget ca-certificates

#install apache flume
RUN mkdir -p /opt/flume/plugins.d/agent/lib \
  && mkdir -p /opt/logs \
  && wget ${MIRROR}/${VERSION}/${BIN_VERSION}-bin.tar.gz \
  && tar -zxvf ${BIN_VERSION}-bin.tar.gz -C /opt/flume --strip 1 \
  && rm -rf ${BIN_VERSION}.tgz

# mv dataAdapter library
COPY ./dataAdapter/build/libs/dataAdapter.jar /opt/flume/plugins.d/agent/lib/dataAdapter.jar
COPY ./dataAdapter/src/main/agent/lib /opt/flume/plugins.d/agent/libext

# mv flume agent settings
COPY ./dataAdapter/src/main/agent/adaptorWO.conf /opt/flume/conf
COPY ./dataAdapter/src/main/agent/flume-env.sh /opt/flume/conf
COPY ./dataAdapter/src/main/agent/log4j2.xml /opt/flume/conf/log4j2.xml