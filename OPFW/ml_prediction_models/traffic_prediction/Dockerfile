FROM nvcr.io/nvidia/pytorch:22.12-py3

ARG user=fedit2025_trapred
ARG passwd=fedit2025_trapred
ARG UID=1000
ARG GID=1000
ARG DEBIAN_FRONTEND=noninteractive

ENV USER=$user
ENV PASSWD=$passwd
ENV WORKSPACE=/home/$USER/workspace
ENV TZ=Asia/Seoul
ENV SHELL=/bin/bash
ENV NVIDIA_DRIVER_CAPABILITIES=all

#################################################################################

RUN cd /etc/apt && \
    sed -i 's/archive.ubuntu.com/mirror.kakao.com/g' /etc/apt/sources.list

RUN apt update && \
    apt install -y build-essential software-properties-common pkg-config cmake sudo &&\
    apt install -y zip unzip nano git wget curl tzdata net-tools iputils-ping &&\
    apt install -y libssl-dev libusb-1.0-0-dev libgtk-3-dev usbutils openssh-server &&\
    apt install -y systemd systemd-sysv dbus dbus-user-session --fix-missing

RUN groupadd -g $GID $USER

RUN useradd --no-log-init -u $UID -g $GID -ms /bin/bash $USER && \
    usermod -aG sudo $USER && \
    usermod -aG video $USER && \
    echo "$PASSWD:$PASSWD" | chpasswd && \
    chsh -s /bin/bash $USER && \
    echo "%sudo ALL=(ALL) NOPASSWD:ALL">>/etc/sudoers

RUN echo 'root:root' | chpasswd && \
    printf '#!/bin/sh\nexit 0' > /usr/sbin/policy-rc.d

RUN mkdir -p /home/$USER/.temp

#################################################################################

USER $USER
WORKDIR /home/$USER
RUN mkdir -p /home/$USER/.local /home/$USER/.vnc $WORKSPACE /home/$USER/traffic-prediction

ENV PATH=/home/${USER}/.local/bin:$PATH

RUN sudo apt install -y mariadb-client

RUN pip install -U Cython glances[gpu] nodejs npm ujson wget Flask requests
RUN pip install -U pillow matplotlib einops pandas pyyaml joblib
RUN pip install -U scikit-learn scikit-image seaborn netifaces schedule 

ADD app.py /home/$USER/traffic-prediction
ADD configs.yaml /home/$USER/traffic-prediction

#################################################################################

ENV PATH=/usr/local/cuda/bin:/usr/bin:/usr/local/sbin:/usr/sbin:$PATH
ENV LD_LIBRARY_PATH=/usr/local/vnclib:/usr/local/cuda/lib64:$LD_LIBRARY_PATH

ADD entrypoint.sh /home/$USER/.local

RUN sudo chown $USER /home/$USER/.local/entrypoint.sh && \
    chgrp $USER /home/$USER/.local/entrypoint.sh && \
    chmod +x /home/$USER/.local/entrypoint.sh

#################################################################################

RUN sudo rm -rf /home/$USER/.temp/ /var/lib/apt/lists/*
ENTRYPOINT /home/$USER/.local/entrypoint.sh

#################################################################################




