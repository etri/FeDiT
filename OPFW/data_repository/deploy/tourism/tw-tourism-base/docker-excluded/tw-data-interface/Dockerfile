FROM ubuntu:22.04

ENV TZ=Asia/Seoul
RUN apt-get update && \
    apt-get install -y openjdk-17-jdk && \
    apt-get install -y vim net-tools openssh-server && \
    apt-get install -yq tzdata && \
    ln -fs /usr/share/zoneinfo/Asia/Seoul /etc/localtime && \
        dpkg-reconfigure -f noninteractive tzdata

ARG WORKDIR
ENV WORKDIR ${WORKDIR}
WORKDIR ${WORKDIR}
COPY ./entrypoint.sh ./
COPY ./test.sh ./

RUN chmod 755 entrypoint.sh

#set password
RUN echo 'root:jin1234' |chpasswd
RUN useradd -rm -d /home/jin -s /bin/bash -g root -G sudo -u 1000 jin
RUN echo 'jin:jin1234' |chpasswd

#replace sshd_config
RUN sed -ri 's/^#?PermitRootLogin\s+.*/PermitRootLogin yes/' /etc/ssh/sshd_config
#RUN sed -ri 's/^#?PermitRootLogin\s+.*/PermitRootLogin no/' /etc/ssh/sshd_config
#RUN sed -ri 's/^#?PasswordAuthentication\s+.*/PasswordAuthentication yes/' /etc/ssh/sshd_config

# CMD ["/usr/sbin/init"]