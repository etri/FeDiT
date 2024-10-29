# FederatedTwin

Implementation of Digital Twin Platform that supports federation of twins

## Features

-  A platform based on federated object composition and data processing core technology to provide large-scale federated services by combining public sector digital twins from different heterogeneous domains

## Installation

-  OpenJDK 11

```
$ yum list java*jdk-devel
$ sudo yum install -y java-11-openjdk-devel.x86_64
$ java --version
$ rpm -qa java*jdk-devel
 * JAVA_HOME setting
  - all user : /etc/profile
  - specific user : ~/.bash_profile
  export JAVA_HOME=/usr/lib/jvm/java-11-openjdk-11.0.19.0.7-1.el7_9.x86_64
  source /etc/profile
```

-  Node.js (v16)

```
* Epel 저장소 확인
$yum repolist
* Epel 저장소 없을 경우 설치 진행
 $sudo yum install epel-release
Nodejs 16버전 설치
$curl -sL https://rpm.nodesource.com/setup_16.x | sudo -E bash -
$sudo yum install -y gcc-c++ make
$sudo yum install -y nodejs
```

-  PM2

```
$sudo npm install –g pm2
$pm2 install pm2-logrotate

* pm2로 app.js 실행 시 명령어
pm2 start app.js

* pm2 명령어
pm2 list
Pm2 reload
Pm2 stop
Pm2 delete
Pm2 log procID

```

-  MQTT

```
$yum install –y epel-release
$yum install –y mosquitto
$systemctl start mosquitto
$systemctl enable mosquito

```

-  Kafka (v2.11-2.4.0)

```
wget https://archive.apache.org/dist/kafka/2.4.0/kafka_2.11-2.4.0.tgz
Tar –xvzf kafka*.tgz
* Connect-distribute.config파일 수정
Rest.host.name=aaa.bbb.ccc.ddd
Rest.port=8083
Rest.advertised.host.name= aaa.bbb.ccc.ddd
rest. Advertised.port=8083
consumer.auto.offset.reset=latest

* 다운로드한 plugin 위치 주소 입력 (git 다운로드 폴더 위치 확인 필요)
plugin.path=/sync_engine/plugin/kafka-connector

Server.properties 수정 주석 제거 및 주소 입력
Listener=PLAINTEXT://:9092
Advertise= PLAINTEXT://aaa.bbb.ccc.ddd:9092

Postgresql jdbc 추가 (kafka_2.11-2.4.0/libs/ 위치에 jar파일 추가)
https://jdbc.postgresql.org/download/ 다운로드
wget https://jdbc.postgresql.org/download/postgresql-42.5.1.jar
```

-  Flink (v1.17.0)

```
* download
$wget https://archive.apache.org/dist/flink/flink-1.17.0/flink-1.17.0-bin-scala_2.12.tgz
$tar -xvzf flink-1.17.0-bin-scala_2.12.tgz
* library 연결
 $ cp /sync_engine/plugin/flink-lib/* flink-1.17.0/lib)
 - flink-connector-files-1.17.0.jar
 - flink-sql-connector-kafka-1.17.0.jar
 - kafka-clients-3.4.0.jar
 - postgresql-42.6.0.jar
 - flink-connector-jdbc-3.1.0-1.17.jar
 - flink-json-1.17.0.jar
 - sedona-flink-shaded_2.12-1.5.1-SNAPSHOT.jar

* Config file (conf/flink-conf.yaml)
jobmanager.rpc.address: 192.168.145.13
jobmanager.rpc.port: 6123
jobmanager.bind-host: 0.0.0.0
jobmanager.memory.process.size: 3200m
taskmanager.bind-host: 192.168.145.13
taskmanager.host: 192.168.145.13
taskmanager.memory.process.size: 3456m
taskmanager.memory.flink.size: 2560m
taskmanager.numberOfTaskSlots: 8
parallelism.default: 1
execution.checkpointing.interval: 3min
execution.checkpointing.mode: EXACTLY_ONCE
state.backend.type: rocksdb
state.checkpoints.dir: file:///data/flink/flink-checkpoints
state.savepoints.dir: file:///data/flink/flink-savepoints
jobmanager.execution.failover-strategy: region
rest.port: 8081
rest.address: 192.168.145.13
rest.bind-address: 192.168.145.13
io.tmp.dirs: /tmp/flink
sql-gateway.endpoint.type: rest
sql-gateway.endpoint.rest.address: 192.168.145.13
sql-gateway.endpoint.rest.port: 8087
sql-gateway.session.idle-timeout: 0
rest.flamegraph.enabled: true

* /etc/profile 에 FLINK_HOME setting (set command: source /etc/profile)
export JAVA_HOME=/usr/lib/jvm/java-11-openjdk-11.0.19.0.7-1.el7_9.x86_64
export FLINK_HOME=/home/cotlab/flink-release-1.17.0/build-target
export PATH=$PATH:$FLINK_HOME/bin

* Flink cluster 설정 (master, worker 같은 디렉토리(/home/cotlab/flink-1.7.1) 위치 + master, worker 설정은 matser 노드만 하면 됨, flink-conf.yaml 파일은 모든 노드가 다 수정해야 함)
 - 6123, 8081, 8087 포트 설정
 - Ssl keygen , ssl open key? 설정으로 비밀번호 없이 ssh 가능하게 만들어야 start cluster 할 때 비밀번호 입력 안해도 됨
 - 실행중인 port 확인 sudo netstat -lntp |grep 8081

* Flink 실행 명령어
$bin/start-cluster 실행
$bin/sql-gateway 실행

```

-  Postgres (v12)

```
* Max open files 설정 변경
 Vi /etc/security/limits.conf
 Postgres soft nofile 65535
 Postgres hard nofile 65535
 Postgres soft nproc 65535
 Postgres hard nporc 65535
* 관련 패키지 설치
 gcc gcc-c++ make autoconf readline readlin-devel zlib zlib-devel openssl openssl-devel gettext gettext-devel python python-devel wget
* Yum install
 sudo yum install -y https://download.postgresql.org/pub/repos/yum/reporpms/EL-7-x86_64/pgdg-redhat-repo-latest.noarch.rpm
 sudo yum install -y postgresql12-server
 sudo /usr/pgsql-12/bin/postgresql-12-setup initdb
 sudo systemctl enable postgresql-12
 sudo systemctl start postgresql-12
 sudo systemctl status postgresql-12

* 비밀번호 변경 / db 생성
su - postgres
psql
 - Password 설정
 \password postgres
 - db 생성
 Create database federated_digital_twin;
* 외부에서 접속 허용
 - /var/lib/pgsql/12/data/postgresl.conf
 listen_addresses = ‘*’
 port = 5432
 - /var/lib/pgsql/12/data/pg_hba.conf
 host all all 0.0.0.0/0 md5

* Postgres sql dump file import
 - sync_engine/import 위치에서 사용자 계정 전환
 su postgres
 - Dump파일 import
 psql federated_digital_twin < federated_twin-dump
```

## execution

-  jps (Displays a list of running Java processes)

```
Jps
QuorumPeerMain
Kafka
ConnectDistributed
TaskManagerRunner
StandaloneSessionClusterEntrypoin
SqlGateway
```

-  pm2 command

```
   $pm2 start federatedDigitalBrain/app.js
   $pm2 start federatedDigitalConnector/app.js
```

## License
