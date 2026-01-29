# **FederatedTwin**

Implementation of a Digital Twin Platform supporting large-scale federated services
based on federated object composition and heterogeneous data processing.

---

## **Features**

- A platform based on federated object composition and data processing core technology to provide large-scale federated services by combining public sector digital twins from different heterogeneous domains

---

# **Installation Guide**

⚠️ **운영체제(OS)별 설치 명령어 주의**

본 문서에는 **CentOS / Ubuntu 설치 명령어가 함께 포함**되어 있습니다.  
아래 명령어 실행 전, **본인이 사용하는 운영체제에 해당하는 섹션만 실행**하시기 바랍니다.

- Ubuntu 사용자는 `[v.Ubuntu]` 표시된 명령어만 실행
- CentOS 사용자는 `[v.CentOS]` 표시된 명령어만 실행

다른 OS의 명령어(`yum`, `apt`)를 혼용하여 실행할 경우 오류가 발생할 수 있습니다.

ℹ️ **sync_engine 경로 안내**

본 문서에서 사용되는 `/sync_engine` 경로는  
프로젝트 내 `FeDiT/CDFW/synchronization_management` 디렉토리를 의미합니다.

---

## **OpenJDK 11 설치 및 JAVA_HOME설정**

**[v.CentOS]**

```bash
# 설치 가능한 JDK 목록 확인 (선택 사항)
yum list java*jdk-devel

# OpenJDK 11 설치
sudo yum install -y java-11-openjdk-devel.x86_64

# OpenJDK 11 설치확인
java --version

# JAVA_HOME 설정
sudo vi /etc/profile
# 아래 내용 추가:
export JAVA_HOME=/usr/lib/jvm/java-11-openjdk-11.0.19.0.7-1.el7_9.x86_64
export PATH=$PATH:$JAVA_HOME/bin

# 설정 적용:
source /etc/profile
# JAVA_HOME 설정 확인
echo $JAVA_HOME
# 정상 출력 예:
/usr/lib/jvm/java-11-openjdk-11.0.19.0.7-1.el7_9.x86_64
```

**[v.Ubuntu]**

```bash
# OpenJDK 11 설치
sudo apt-get update
sudo apt-get install -y openjdk-11-jdk

# Java 실행 파일 경로 확인
## Java가 실제로 설치된 위치를 확인하는 단계입니다.
readlink -f $(which java)

# 예시 출력:
# /usr/lib/jvm/java-11-openjdk-amd64/bin/java
# 👉 JAVA_HOME은 /bin/java를 제외한 상위 경로입니다

# JAVA_HOME 설정
sudo vi /etc/profile

#아래 내용 추가:
export JAVA_HOME=/usr/lib/jvm/java-11-openjdk-amd64
export PATH=$PATH:$JAVA_HOME/bin

#설정 적용:
source /etc/profile

# JAVA_HOME 설정 확인
echo $JAVA_HOME

# 정상 출력 예:
#/usr/lib/jvm/java-11-openjdk-amd64
```

---

## **Node.js (v16) 설치**

**[v.CentOS]**

```bash
# EPEL 저장소 설치 (이미 설치되어 있어도 문제 없음)
sudo yum install -y epel-release

# Node.js 16.x 저장소 등록
curl -sL https://rpm.nodesource.com/setup_16.x | sudo bash -

# 빌드 도구 및 Node.js 설치
sudo yum install -y gcc-c++ make nodejs

# 설치 확인
node -v
npm -v
```

**[v.Ubuntu]**

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash

# 쉘 환경 다시 로드
source ~/.bashrc

# nvm 정상 로드 확인
export NVM_DIR="$HOME/.nvm"

# Node.js 16 설치 및 사용
nvm install 16.17.0
nvm use 16.17.0

node -v
# v16.17.0

npm -v
# 8.15.0
```

---

## **PM2 설치 및 실행**

```bash
sudo npm install -g pm2
pm2 install pm2-logrotate
```

**[PM2 실행 명령어 안내]**

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

**[v.CentOS]**

```bash
$yum install -y epel-release
$yum install -y mosquitto
$systemctl start mosquitto
$systemctl enable mosquito
```

**[v.Ubuntu]**

```bash
sudo apt install -y mosquitto mosquitto-clients
sudo systemctl start mosquitto
sudo systemctl enable mosquitto
sudo systemctl status mosquitto
```

---

# **Kafka (v2.11-2.4.0)**

## 1. Kafka 다운로드 및 압축 해제

```bash
wget https://archive.apache.org/dist/kafka/2.4.0/kafka_2.11-2.4.0.tgz
tar -xvzf kafka_2.11-2.4.0.tgz

cd kafka_2.11-2.4.0/config
# config파일들 확인
ls
```

## 2. Kafka Connect 설정 (config/connect-distributed.properties)

- connect-distributed.properties 파일 수정(주석제거 및 주소입력)

### 2-1. 서버 IP 확인

아래 명령어로 Kafka가 실행 중인 서버의 IP 주소를 확인합니다.

```bash
hostname -I
```

예시 출력:

```bash
192.168.145.13
```

### 2-2. 설정 파일 열기

```bash
cd kafka_2.11-2.4.0/config
vi connect-distributed.properties
```

### 2-3. 설정 파일 수정

> 아래 설정에서 aaa.bbb.ccc.ddd 부분을
> 위에서 확인한 서버의 실제 IP 주소로 반드시 변경하세요.

```properties

rest.host.name=aaa.bbb.ccc.ddd
rest.port=8083
rest.advertised.host.name=aaa.bbb.ccc.ddd
rest.advertised.port=8083
connector.client.config.override.policy=All
consumer.auto.offset.reset=latest
plugin.path=/sync_engine/plugin/kafka-connector
```

> ⚠️ **중요**
> plugin.path 경로에는 아래의 안내에 따라 직접 빌드한 커스텀 커넥터 JAR들이 위치해야 합니다.

## 3. 커넥터 디렉토리 구조

```bash
connector/
 ├── jdbc-connector-for-apache-kafka/
 ├── kafka-http-mqtt-connetor/
 └── kafka-sink-connector/
```

각 디렉토리는 Gradle 기반이며 JAR 빌드 후 connect-distributed.properties에 지정한 plugin.path로 이동해야 합니다.

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
# 폴더 확인
ls /sync_engine/plugin/kafka-connector

cp connector/jdbc-connector-for-apache-kafka/build/libs/*.jar \
   /sync_engine/plugin/kafka-connector/

cp connector/kafka-http-mqtt-connetor/build/libs/*.jar \
   /sync_engine/plugin/kafka-connector/

cp connector/kafka-sink-connector/build/libs/*.jar \
   /sync_engine/plugin/kafka-connector/
```

## 5. Broker 설정 (config/server.properties)

```bash
cd kafka_2.11-2.4.0/config
vi server.properties
```

```properties
# server.properties 파일 수정(주석제거 및 주소입력)

listeners=PLAINTEXT://:9092
advertised.listeners=PLAINTEXT://aaa.bbb.ccc.ddd:9092
```

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

### 2-2) Sedona Flink 라이브러리 추가 (중요)

```bash
wget https://repo1.maven.org/maven2/org/apache/sedona/sedona-flink-shaded-3.0_2.12/1.5.1/sedona-flink-shaded-3.0_2.12-1.5.1.jar \
     -O sedona-flink-shaded_2.12-1.5.1-SNAPSHOT.jar

cp sedona-flink-shaded_2.12-1.5.1-SNAPSHOT.jar flink-1.17.0/lib/
```

> ⚠️ Sedona JAR는 반드시 `flink-1.17.0/lib/`에 위치해야 합니다.

## 3. flink-conf.yaml 설정

- 주석제거 및 주소입력

> 아래 설정에서 `aaa.bbb.ccc.ddd`는  
> **Flink JobManager가 실행되는 서버의 IP 주소**로 변경해야 합니다.

```yaml
jobmanager.rpc.address: aaa.bbb.ccc.ddd
jobmanager.rpc.port: 6123
jobmanager.bind-host: 0.0.0.0
jobmanager.memory.process.size: 3200m

taskmanager.bind-host: aaa.bbb.ccc.ddd
taskmanager.host: aaa.bbb.ccc.ddd
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
rest.address: aaa.bbb.ccc.ddd
rest.bind-address: aaa.bbb.ccc.ddd

io.tmp.dirs: /tmp/flink

sql-gateway.endpoint.type: rest
sql-gateway.endpoint.rest.address: aaa.bbb.ccc.ddd
sql-gateway.endpoint.rest.port: 8087
sql-gateway.session.idle-timeout: 0

rest.flamegraph.enabled: true
```

## 4. /etc/profile 환경 변수 설정

```bash
export FLINK_HOME=$HOME/flink-1.17.0
export PATH=$PATH:$FLINK_HOME/bin
```

```bash
source /etc/profile
```

## 5. Flink 클러스터 구성 (선택 사항)

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
or
ss -lntp | grep 8081
```

---

# **Postgres (v12)**

## 1. Max open files 설정

> PostgreSQL은 동시에 많은 파일/프로세스를 사용할 수 있으므로
> OS 레벨에서 파일 디스크립터 제한을 늘려야 합니다.

```
vi /etc/security/limits.conf

# 아래 내용 추가:
postgres soft nofile 65535
postgres hard nofile 65535
postgres soft nproc 65535
postgres hard nproc 65535
```

## 2. 의존 패키지 설치

**[v.CentOS]**

```bash
yum install -y gcc gcc-c++ make autoconf readline readline-devel zlib zlib-devel openssl openssl-devel gettext gettext-devel python python-devel wget
```

## 3. 설치 및 초기화

**[v.CentOS]**

```bash

sudo yum install -y https://download.postgresql.org/pub/repos/yum/reporpms/EL-7-x86_64/pgdg-redhat-repo-latest.noarch.rpm
sudo yum install -y postgresql12-server

sudo /usr/pgsql-12/bin/postgresql-12-setup initdb
systemctl enable postgresql-12
systemctl start postgresql-12
systemctl status postgresql-12
```

**[v.Ubuntu]**

```bash
sudo apt update
sudo apt install -y postgresql-12 postgresql-client-12

sudo systemctl start postgresql
sudo systemctl enable postgresql
sudo systemctl status postgresql
```

## 4. 외부 접속 허용

**[v.CentOS]**

- postgresql.conf

```bash
sudo vi /etc/postgresql/12/main/postgresql.conf
```

```conf
listen_addresses = '*'
port = 5432
```

- pg_hba.conf

```bash
sudo vi /etc/postgresql/12/main/pg_hba.conf
```

```conf
host all all 0.0.0.0/0 md5
```

```bash
sudo systemctl restart postgresql-12
```

**[v.Ubuntu]**

- postgresql.conf

```bash
sudo vi /etc/postgresql/12/main/postgresql.conf
```

```conf
listen_addresses = '*'
port = 5432
```

- pg_hba.conf

```bash
sudo vi /etc/postgresql/12/main/pg_hba.conf
```

```conf
host all all 0.0.0.0/0 md5
```

```bash
sudo systemctl restart postgresql
```

## **🔐 공통 설정 (CentOS / Ubuntu)**

## 5. 비밀번호 설정 및 DB 생성

```bash
sudo -u postgres psql
ALTER USER postgres PASSWORD '<passwd지정>';
CREATE DATABASE federated_digital_twin;
```

종료:

```sql
\q
```

## 6. Dump 파일 Import

```bash
su - postgres

# import 폴더로 이동 (예: /sync_engine/import)
cd /sync_engine/import

# federated_digital_twin-dump.sql 파일을 DB에 import
psql federated_digital_twin < federated_digital_twin-dump.sql
```

> ⚠️ 반드시 `federated_digital_twin-dump.sql` 파일이 해당 디렉토리에 존재해야 합니다.
> (예: `/sync_engine/import/federated_digital_twin-dump.sql`)

---

# **federatedDigitalBrain/federatedDigitalConnector 설정**

⚠️ 이 단계에서는 Brain과 Connector의 설정 파일을 모두 수정해야 합니다.
두 서비스는 서로 다른 포트를 사용하지만 같은 서버 IP를 공유합니다.

## 1. 설정 파일 위치

```bash
# Brain 설정
cd /sync_engine/federatedDigitalBrain
vi config/index.js

# Connector 설정
cd /sync_engine/federatedDigitalConnector
vi config/index.js
```

> ⚠️ 두 디렉토리 모두 config/index.js를 수정해야 합니다.

## 2. 서버 IP 주소 설정 (aaa.bbb.ccc.ddd 변경)

설정 파일 곳곳에 등장하는 aaa.bbb.ccc.ddd 는 현재 서버의 실제 IP 주소로 반드시 변경해야 합니다. (서버 1대일 경우 localhost로 진행가능)
⚠️ kafka, flink, DB 서버가 다른 서버에 있다면 host를 해당 서버 IP로 변경

```
# aaa.bbb.ccc.ddd 값에 서버의 실제 IP를 사용해야 합니다.

🔹 Kafka / Kafka Connect 주소
exports.kafka = {
  host: "192.168.145.13:9092",
  connectHost: "192.168.145.13:8083",
};

🔹 Flink SQL Gateway 주소
exports.flink = {
  gwOption: {
    host: "192.168.145.13:8087",
    hostname: "192.168.145.13",
    port: 8087,
  },
  ...
};

🔹 postgresql 주소 및 비밀번호 설정
exports.postgresPool = {
  host: "localhost",
  port: 5432,
  user: "postgres",
  password: "<postgresql설정 시 지정한 비밀번호 작성>",
  database: "federated_digital_twin",
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};
```

## 3. Sedona JAR 경로 수정 (sedonaJarLocation)

### 3-1. Sedona JAR 실제 위치 찾기

```bash
# Flink lib에 넣었다면:
ls $FLINK_HOME/lib | grep sedona
```

### 3-2. 설정 예시

```bash
# 위에서 찾은 sedona jar 실제 위치 작성
sedonaJarLocation: "/home/USER/flink-1.17.0/lib/sedona-flink-shaded_2.12-1.5.1-SNAPSHOT.jar"
```

## 4) 패키지 설치 (Brain / Connector)

```bash
cd sync_engine\federatedDigitalBrain
npm install

cd ../federatedDigitalConnector
npm install
```

⚠️ npm i 중 에러가 나면 Node 버전(node -v)이 16인지 먼저 확인하세요

```
node -v
# v16.x 이어야 함
```

---

# **Execution**

## kafka 실행

```bash
cd ~/kafka_2.11-2.4.0
# zookeeper 실행
bin/zookeeper-server-start.sh -daemon config/zookeeper.properties
# kafka 실행
bin/kafka-server-start.sh -daemon config/server.properties
# kafka-connector 실행
bin/connect-distributed.sh -daemon config/connect-distributed.properties
```

## Flink 실행

```bash
# 클러스터 실행
bin/start-cluster.sh

# SQL Gateway 실행
bin/sql-gateway.sh start
```

---

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

## 동기화 엔진 PM2 실행

```bash
cd sync_engine
pm2 start federatedDigitalBrain/app.js
pm2 start federatedDigitalConnector/app.js
```

- 실행 화면 예시
  ![alt text](image.png)
