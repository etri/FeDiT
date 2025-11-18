# **FederatedTwin**

Implementation of a Digital Twin Platform supporting large-scale federated services
based on federated object composition and heterogeneous data processing.

---

## **Features**

- A platform based on federated object composition and data processing core technology to provide large-scale federated services by combining public sector digital twins from different heterogeneous domains

---

# **Installation Guide**

## **OpenJDK 11 설치**

```bash
yum list java*jdk-devel
sudo yum install -y java-11-openjdk-devel.x86_64
java --version
rpm -qa java*jdk-devel
```

### JAVA_HOME 설정

**모든 사용자**

```bash
sudo vi /etc/profile
export JAVA_HOME=/usr/lib/jvm/java-11-openjdk-11.0.19.0.7-1.el7_9.x86_64
source /etc/profile
```

**특정 사용자**

```bash
vi ~/.bash_profile
export JAVA_HOME=/usr/lib/jvm/java-11-openjdk-11.0.19.0.7-1.el7_9.x86_64
source ~/.bash_profile
```

---

## **Node.js (v16) 설치**

```bash
yum repolist
sudo yum install epel-release -y

curl -sL https://rpm.nodesource.com/setup_16.x | sudo -E bash -
sudo yum install -y gcc-c++ make
sudo yum install -y nodejs
```

---

## **PM2 설치 및 실행**

```bash
sudo npm install -g pm2
pm2 install pm2-logrotate
```

### PM2 실행 명령어

```bash
pm2 start app.js
pm2 list
pm2 reload
pm2 stop
pm2 delete
pm2 log <procID>
```

---

## **MQTT (Mosquitto)**

```bash
yum install -y epel-release
yum install -y mosquitto
systemctl start mosquitto
systemctl enable mosquitto
```

---

# **Kafka (v2.11-2.4.0)**

## 1. Kafka 다운로드 및 압축 해제

```bash
wget https://archive.apache.org/dist/kafka/2.4.0/kafka_2.11-2.4.0.tgz
tar -xvzf kafka_2.11-2.4.0.tgz
```

---

## 2. Kafka Connect 설정 (connect-distributed.properties)

```properties
rest.host.name=aaa.bbb.ccc.ddd
rest.port=8083
rest.advertised.host.name=aaa.bbb.ccc.ddd
rest.advertised.port=8083

consumer.auto.offset.reset=latest

plugin.path=/sync_engine/plugin/kafka-connector
```

> ⚠️ **중요**
> plugin.path 경로에는 직접 빌드한 커스텀 커넥터 JAR들이 위치해야 합니다.

---

## 3. 커넥터 디렉토리 구조

```bash
connector/
 ├── jdbc-connector-for-apache-kafka/
 ├── kafka-http-mqtt-connetor/
 └── kafka-sink-connector/
```

각 디렉토리는 Gradle 기반이며 JAR 빌드 후 plugin.path로 이동해야 합니다.

---

## 4. 커넥터 빌드 및 JAR 배치

### 4-1) 커넥터 빌드

```bash
# JDBC Connector
cd connector/jdbc-connector-for-apache-kafka
./gradlew clean build

# HTTP/MQTT Connector
cd ../kafka-http-mqtt-connetor
./gradlew clean build

# Sink Connector
cd ../kafka-sink-connector
./gradlew clean build
```

### 4-2) 빌드된 JAR 파일 이동

```bash
mkdir -p /sync_engine/plugin/kafka-connector

cp connector/jdbc-connector-for-apache-kafka/build/libs/*.jar \
   /sync_engine/plugin/kafka-connector/

cp connector/kafka-http-mqtt-connetor/build/libs/*.jar \
   /sync_engine/plugin/kafka-connector/

cp connector/kafka-sink-connector/build/libs/*.jar \
   /sync_engine/plugin/kafka-connector/
```

---

## 5. Broker 설정 (server.properties)

```properties
listeners=PLAINTEXT://:9092
advertised.listeners=PLAINTEXT://aaa.bbb.ccc.ddd:9092
```

---

## 6. PostgreSQL JDBC 드라이버 추가

```bash
cd kafka_2.11-2.4.0/libs/
wget https://jdbc.postgresql.org/download/postgresql-42.5.1.jar
```

---

# **Flink (v1.17.0)**

## 1. Flink 다운로드

```bash
wget https://archive.apache.org/dist/flink/flink-1.17.0/flink-1.17.0-bin-scala_2.12.tgz
tar -xvzf flink-1.17.0-bin-scala_2.12.tgz
```

---

## 2. Flink 라이브러리 세팅

### 2-1) 기본 라이브러리 복사

```bash
cp /sync_engine/plugin/flink-lib/* flink-1.17.0/lib/
```

복사되는 파일:

- flink-connector-files-1.17.0.jar
- flink-sql-connector-kafka-1.17.0.jar
- kafka-clients-3.4.0.jar
- postgresql-42.6.0.jar
- flink-connector-jdbc-3.1.0-1.17.jar
- flink-json-1.17.0.jar

---

### 2-2) Sedona Flink 라이브러리 추가 (중요)

```bash
wget https://repo1.maven.org/maven2/org/apache/sedona/sedona-flink-shaded-3.0_2.12/1.5.1/sedona-flink-shaded-3.0_2.12-1.5.1.jar \
     -O sedona-flink-shaded_2.12-1.5.1-SNAPSHOT.jar

cp sedona-flink-shaded_2.12-1.5.1-SNAPSHOT.jar flink-1.17.0/lib/
```

> ⚠️ Sedona JAR는 반드시 `flink-1.17.0/lib/`에 위치해야 합니다.

---

## 3. flink-conf.yaml 설정

```yaml
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
```

---

## 4. /etc/profile 환경 변수

```bash
export JAVA_HOME=/usr/lib/jvm/java-11-openjdk-11.0.19.0.7-1.el7_9.x86_64
export FLINK_HOME=/home/cotlab/flink-1.17.0
export PATH=$PATH:$FLINK_HOME/bin
```

```bash
source /etc/profile
```

---

## 5. Flink 클러스터 구성

- 모든 노드 동일 경로 설치
- master 노드에서 `masters`, `workers` 파일 설정
- `flink-conf.yaml` 모든 노드 동일
- 필요한 포트

| Port | Description     |
| ---- | --------------- |
| 6123 | JobManager RPC  |
| 8081 | Flink Dashboard |
| 8087 | SQL Gateway     |

SSH 무패스 설정 필요.

포트 확인:

```bash
sudo netstat -lntp | grep 8081
```

---

## 6. Flink 실행

### 클러스터 실행

```bash
bin/start-cluster.sh
```

### SQL Gateway 실행

```bash
bin/sql-gateway.sh start
```

---

# **Postgres (v12)**

## 1. Max open files 설정

```
vi /etc/security/limits.conf

postgres soft nofile 65535
postgres hard nofile 65535
postgres soft nproc 65535
postgres hard nproc 65535
```

---

## 2. 의존 패키지 설치

```bash
yum install -y gcc gcc-c++ make autoconf readline readline-devel zlib zlib-devel openssl openssl-devel gettext gettext-devel python python-devel wget
```

---

## 3. 설치 및 초기화

```bash
sudo yum install -y https://download.postgresql.org/pub/repos/yum/reporpms/EL-7-x86_64/pgdg-redhat-repo-latest.noarch.rpm
sudo yum install -y postgresql12-server

sudo /usr/pgsql-12/bin/postgresql-12-setup initdb
systemctl enable postgresql-12
systemctl start postgresql-12
systemctl status postgresql-12
```

---

## 4. 비밀번호 설정 및 DB 생성

```bash
su - postgres
psql
\password postgres
CREATE DATABASE federated_digital_twin;
```

---

## 5. 외부 접속 허용

### postgresql.conf

```
listen_addresses = '*'
port = 5432
```

### pg_hba.conf

```
host all all 0.0.0.0/0 md5
```

---

## 6. Dump 파일 Import

```bash
su - postgres

# import 폴더로 이동 (예: /sync_engine/import)
cd /sync_engine/import

# federated_digital_twin-dump.sql 파일을 DB에 import
psql federated_digital_twin < federated_digital_twin-dump.sql
```

> ⚠️ 반드시 `federated_digital_twin-dump.sql` 파일이 위치한 경로에서 실행해야 합니다.
> (예: `/sync_engine/import/federated_digital_twin-dump.sql`)

---

# **Execution**

## Java Process 확인

```bash
jps
```

예시:

```
Jps
QuorumPeerMain
Kafka
ConnectDistributed
TaskManagerRunner
StandaloneSessionClusterEntrypoint
SqlGateway
```

---

## PM2 실행

```bash
pm2 start federatedDigitalBrain/app.js
pm2 start federatedDigitalConnector/app.js
```

---

# **License**
