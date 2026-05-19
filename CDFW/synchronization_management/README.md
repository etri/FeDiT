# **FederatedTwin**

Implementation of a Federated Digital Twin Platform supporting large-scale federated services
based on federated object composition and heterogeneous data processing.

The platform integrates multiple technologies including Kafka, Flink, MQTT, PostgreSQL, Airflow, and provides APIs to manage and operate Federated Digital Twins and Digital Objects.

---

# 🚀 Quick Start

Run the entire FederatedTwin platform with Docker Compose.

```bash
git clone https://github.com/KETICoTLab/FederatedTwin.git
cd FederatedTwin

docker compose up -d --build
```

---

## Features

- Federated Digital Twin management

- Digital Object composition

- Real-time data ingestion and processing

- External data connector integration

- Stream processing using Flink

- Kafka-based data pipeline

- MQTT sensor data ingestion

- Workflow orchestration using Airflow

---

## System Architecture

FederatedTwin is composed of multiple distributed services that collaborate to manage Digital Twin data.

| Component         | Description                  |
| ----------------- | ---------------------------- |
| PostgreSQL        | Stores Digital Twin metadata |
| Kafka             | Data streaming backbone      |
| Kafka Connect     | External system integration  |
| MQTT              | Sensor data ingestion        |
| Flink             | Real-time data processing    |
| Digital Brain     | Core platform API            |
| Digital Connector | External data ingestion      |
| Airflow           | Data workflow scheduling     |

---

# Installation Guide

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

## OpenJDK 11 설치 및 JAVA_HOME설정

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

## Node.js (v16) 설치

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

## PM2 설치 및 실행

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

## MQTT (Mosquitto)

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

> ⚠️ gradlew: Permission denied는 wrapper 실행권한 문제 — chmod +x gradlew로 해결 가능

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
# 없으면 생성
mkdir /sync_engine/plugin/kafka-connector

# 빌드 성공 후 생성된 jar파일 복사
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

### 2-2) Sedona Flink 라이브러리 추가

```bash
wget https://repo1.maven.org/maven2/org/apache/sedona/sedona-flink-shaded-3.0_2.12/1.5.1/sedona-flink-shaded-3.0_2.12-1.5.1.jar \
     -O sedona-flink-shaded_2.12-1.5.1-SNAPSHOT.jar

cp sedona-flink-shaded_2.12-1.5.1-SNAPSHOT.jar flink-1.17.0/lib/
```

> ⚠️ 반드시 위에서 설치한 `flink-1.17.0/lib/`에 위치

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

**[v.CentOS / Ubuntu 공통]**

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

## 5. 비밀번호 설정 및 DB 생성

```bash
sudo -u postgres psql
```

```sql
ALTER USER postgres PASSWORD '<passwd지정>';
```

## 6. Database 생성 (init script 사용)

```bash
psql -U postgres -f docker/postgres/init/01-create-dbs.sql
```

> 📌 해당 스크립트는 아래 DB를 생성합니다:
>
> - federated_digital_twin
> - airflow_db

⚠️ 이미 DB가 존재하는 경우 에러가 발생할 수 있습니다.
필요 시 기존 DB를 삭제하거나 해당 구문을 주석 처리하세요.

## 7. Dump 파일 Import

```bash
su - postgres

# import 폴더로 이동 (예: /sync_engine/import)
cd /sync_engine/import

# federated_digital_twin-dump.sql 파일을 DB에 import
psql federated_digital_twin < federated_digital_twin-dump.sql
```

> ⚠️ 반드시 `federated_digital_twin-dump.sql` 파일이 해당 디렉토리에 존재해야 합니다.
> (예: `/sync_engine/import/federated_digital_twin-dump.sql`)

🔎 Notes

- federated_digital_twin-dump.sql 파일에는 CREATE DATABASE 구문이 포함되어 있지 않습니다
- 반드시 01-create-dbs.sql을 먼저 실행해야 합니다
- Docker 환경에서는 해당 스크립트가 자동 실행됩니다

---

# **Apache Airflow 설치 및 설정**

⚠️ Airflow는 커넥터 스케줄링 및 실행 관리를 위한 선택 구성 요소입니다.  
PostgreSQL 메타데이터 DB 설정이 먼저 완료되어 있어야 합니다.

## 1. Python 가상환경 생성

**[v.Ubuntu]**

```bash
python3 -m venv /home/USER/venvs/airflow
source /home/USER/venvs/airflow/bin/activate
pip install --upgrade pip setuptools wheel
```

**[v.CentOS]**

```bash
python3 -m venv /home/USER/venvs/airflow
source /home/USER/venvs/airflow/bin/activate
pip install --upgrade pip setuptools wheel
```

> ⚠️ USER는 실제 사용자 계정명으로 변경하세요.

## 2. Apache Airflow 설치

> 아래 예시는 Airflow 2.9.3 / Python 3.12 기준입니다.
> Python 버전이 다르면 PYTHON_VERSION 값을 실제 버전에 맞게 변경해야 합니다.

```bash
export AIRFLOW_VERSION=2.9.3
export PYTHON_VERSION=3.12
export CONSTRAINT_URL="https://raw.githubusercontent.com/apache/airflow/constraints-${AIRFLOW_VERSION}/constraints-${PYTHON_VERSION}.txt"

pip install "apache-airflow==${AIRFLOW_VERSION}" --constraint "${CONSTRAINT_URL}"
pip install apache-airflow-providers-postgres --constraint "${CONSTRAINT_URL}"
```

설치 확인:

```bash
airflow version
```

## 3. AIRFLOW_HOME 설정

```bash
export AIRFLOW_HOME=~/airflow
```

필요 시 ~/.bashrc에 영구 적용:

```bash
echo 'export AIRFLOW_HOME=~/airflow' >> ~/.bashrc
source ~/.bashrc
```

## 4. airflow.cfg 설정

Airflow 초기 실행 후 생성된 `airflow.cfg` 파일을 수정합니다.

```bash
cd ~/airflow
vi airflow.cfg
```

아래 항목을 수정합니다.

```bash
sql_alchemy_conn = postgresql+psycopg2://postgres:<postgresql비밀번호>@<POSTGRES_HOST>:5432/airflow_db
result_backend = db+postgresql://postgres:<postgresql비밀번호>@<POSTGRES_HOST>:5432/airflow_db
executor = LocalExecutor
load_examples = False
```

예시:

```bash
sql_alchemy_conn = postgresql+psycopg2://postgres:keti123@localhost:5432/airflow_db
result_backend = db+postgresql://postgres:keti123@localhost:5432/airflow_db
executor = LocalExecutor
load_examples = False
```

> ⚠️ POSTGRES_HOST는 PostgreSQL 서버 주소를 의미합니다.
> 단일 서버 환경이면 localhost, 분리된 DB 서버를 사용하는 경우 해당 서버 IP를 입력하세요.

## 5. Airflow DB 초기화 및 관리자 계정 생성

DB 마이그레이션:

```bash
airflow db migrate
```

관리자 계정 생성:

```bash
airflow users create \
  --username admin \
  --firstname admin \
  --lastname user \
  --role Admin \
  --email admin@example.com \
  --password admin
```

## 6. Airflow Code Editor 설치

```bash
pip install airflow-code-editor
pip install "fsspec>=2024.3.0,<2025"
pip install s3fs
```

## 7. 커스텀 플러그인 경로 설정

커스텀 커넥터 런타임을 사용할 경우 plugins 디렉토리를 Python import 경로에 추가합니다.

```bash
export PYTHONPATH=/home/USER/airflow/plugins:$PYTHONPATH
```

필요 시 ~/.bashrc에 영구 적용:

```bash
echo 'export PYTHONPATH=/home/USER/airflow/plugins:$PYTHONPATH' >> ~/.bashrc
source ~/.bashrc
```

> ⚠️ USER는 실제 사용자 계정명으로 변경하세요.

## 8. Airflow 실행

### 8-1. Scheduler 실행

```bash
source /home/USER/venvs/airflow/bin/activate
export AIRFLOW_HOME=~/airflow
export PYTHONPATH=/home/USER/airflow/plugins:$PYTHONPATH

airflow scheduler
```

### 8-2. Webserver 실행

다른 터미널에서:

```bash
source /home/USER/venvs/airflow/bin/activate
export AIRFLOW_HOME=~/airflow
export PYTHONPATH=/home/USER/airflow/plugins:$PYTHONPATH

airflow webserver -p 8080
```

접속 예시:

```bash
http://localhost:8080
```

## Connector Development Guide (Using Airflow web)

FederatedTwin allows developers to create custom connectors for ingesting external data.

ℹ️ FederatedTwin\airflow\CREATE_CONNECTOR.md 참고

---

# **federatedDigitalBrain/federatedDigitalConnector 설정**

### ⚙️ 환경 설정 (.env.node)

ℹ️ **.env.node 작성 안내**
프로젝트 루트 경로에 `.env.node` 파일을 생성하여 환경 설정값을 작성할 수 있습니다.

`.env.node` 파일이 존재하지 않거나 특정 값이 정의되지 않은 경우,
시스템은 **기본 설정값(default configuration)** 으로 실행됩니다.

**📁 File Location**

`.env.node` 파일의 프로젝트 루트 위치 확인

```
FederatedTwin
├── .env.node
├── docker-compose.yml
├── federatedDigitalBrain
├── federatedDigitalConnector
└── ...
```

**🌐 서버 IP 주소 설정**

설정 파일 곳곳에 등장하는 `aaa.bbb.ccc.ddd` 값은  
**현재 서버의 실제 IP 주소로 반드시 변경해야 합니다.**

> 서버가 **1대일 경우 `localhost` 사용 가능**

⚠️ Kafka / Flink / PostgreSQL 서버가 각기 다른 서버에 있다면 `host` 값을 **해당 서버의 IP 주소로 변경해야 합니다.**

**Example**

```env
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=postgres
POSTGRES_PASSWORD=<postgresql설정 시 지정한 비밀번호 작성>

KAFKA_HOST=localhost:9092

MQTT_HOST=localhost
MQTT_PORT=1883

SEDONA_JAR_PATH=/home/User/flink-1.17.0/lib/
```

**⚠️ Sedona JAR 위치 찾기**

```bash
# Flink lib:
ls $FLINK_HOME/lib | grep sedona
```

---

## 패키지 설치 (Brain / Connector)

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

## 동기화 엔진(DigitalBrain/DigitalConnector) 실행

```bash
cd sync_engine
pm2 start federatedDigitalBrain/app.js
pm2 start federatedDigitalConnector/app.js
```

- 실행 화면 예시
  ![alt text](image.png)

---

# **Docker Compose 실행 가이드**

본 플랫폼은 **Docker Compose 기반으로 전체 서비스를 일괄 실행**할 수 있습니다.  
PostgreSQL, Kafka, Kafka Connect, MQTT, Flink, Digital Brain, Digital Connector, Airflow가 하나의 네트워크에서 동작합니다.

## 1. 사전 요구사항

아래 소프트웨어가 설치되어 있어야 합니다.

| Software       | Version   |
| -------------- | --------- |
| Docker         | 24.x 이상 |
| Docker Compose | v2 이상   |

설치 확인

```bash
docker --version
docker compose version
```

## 2. 환경 구성 (.env)

ℹ️ **`.env` 작성 안내**
`docker compose`는 프로젝트 루트의 `.env` 파일을 자동으로 읽어 컨테이너에 환경 변수를 주입합니다.  
실행 전 반드시 `.env` 파일을 생성해야 합니다 (없으면 변수가 비어 컨테이너 시작 실패).

> 💡 위쪽 **`.env.node`** 는 로컬에서 `node app.js`로 직접 실행할 때 쓰는 파일이고,  
> 이 섹션의 **`.env`** 는 **`docker compose`** 가 컨테이너에 주입하는 변수 모음입니다.  
> 두 파일은 서로 다른 용도로 별도 관리됩니다.

**📁 파일 위치**

```
FederatedTwin
├── .env                  ← 이 파일
├── .env.node             ← (별도, 로컬 Node.js 실행용)
├── docker-compose.yml
└── ...
```

**📋 변수 설명**

| 변수                                                                        | 용도                                                           | 변경 필요성                                            |
| --------------------------------------------------------------------------- | -------------------------------------------------------------- | ------------------------------------------------------ |
| `POSTGRES_HOST`                                                             | brain/connector가 접속할 DB 호스트명                           | 컴포즈 내부는 `postgres` 고정                          |
| `POSTGRES_PORT`                                                             | DB 포트                                                        | 보통 `5432`                                            |
| `POSTGRES_USER` / `POSTGRES_PASSWORD`                                       | DB 계정                                                        | **운영 시 반드시 강한 값으로 변경**                    |
| `POSTGRES_DB`                                                               | brain/connector가 사용할 DB 이름                               | `federated_digital_twin`                               |
| `AIRFLOW_ADMIN_USERNAME` / `AIRFLOW_ADMIN_PASSWORD` / `AIRFLOW_ADMIN_EMAIL` | Airflow 웹 UI 초기 관리자 계정                                 | **운영 시 반드시 강한 값으로 변경**                    |
| `TZ`                                                                        | 컨테이너 타임존                                                | 기본 `Asia/Seoul`                                      |
| `KAFKA_HOST`                                                                | 서비스 컨테이너가 Kafka에 접속할 주소 (컴포즈 내부)            | `kafka:9092` 고정                                      |
| `KAFKA_CONNECT_HOST`                                                        | Kafka Connect REST API 주소 (컴포즈 내부)                      | `kafka-connect:8083` 고정                              |
| `MQTT_HOST` / `MQTT_PORT`                                                   | MQTT 브로커 주소 (컴포즈 내부)                                 | `mqtt` / `1883` 고정                                   |
| `FLINK_GATEWAY_HOST` / `FLINK_GATEWAY_HOSTNAME` / `FLINK_GATEWAY_PORT`      | Flink SQL Gateway 주소 (컴포즈 내부)                           | `flink:8087` 고정                                      |
| `KAFKA_EXTERNAL_HOST`                                                       | **호스트 밖의 클라이언트**가 Kafka에 접속할 때 advertised host | 단일 머신이면 `localhost`, 원격이면 **서버의 공개 IP** |
| `KAFKA_EXTERNAL_PORT`                                                       | 외부 advertised 포트                                           | `19092` (호스트 포트와 일치해야 함)                    |

**Example** (개발용 기본값)

```env
# --- PostgreSQL ---
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_USER=postgres
POSTGRES_PASSWORD=keti123          # ⚠️ 운영 시 변경
POSTGRES_DB=federated_digital_twin

# --- Airflow 관리자 ---
AIRFLOW_ADMIN_USERNAME=admin
AIRFLOW_ADMIN_PASSWORD=admin1234   # ⚠️ 운영 시 변경
AIRFLOW_ADMIN_EMAIL=admin@example.com

# --- 공통 ---
TZ=Asia/Seoul

# --- Kafka (컴포즈 내부 통신) ---
KAFKA_HOST=kafka:9092
KAFKA_CONNECT_HOST=kafka-connect:8083

# --- MQTT ---
MQTT_HOST=mqtt
MQTT_PORT=1883

# --- Flink ---
FLINK_GATEWAY_HOST=flink:8087
FLINK_GATEWAY_HOSTNAME=flink
FLINK_GATEWAY_PORT=8087

# --- Kafka 외부 노출 (호스트 밖 클라이언트용 advertised listener) ---
KAFKA_EXTERNAL_HOST=localhost      # 원격 서버라면 해당 서버의 공개 IP로 변경
KAFKA_EXTERNAL_PORT=19092
```

**🌐 원격 서버에 배포할 때**

`KAFKA_EXTERNAL_HOST`를 **서버의 공개 IP/도메인**으로 바꿔야 외부 클라이언트(예: 다른 머신에서 도는 producer/consumer)가 Kafka에 접속 가능합니다.

```env
KAFKA_EXTERNAL_HOST=220.124.222.84   # 예시: 실제 서버 IP
KAFKA_EXTERNAL_PORT=19092
```

**🔒 보안 주의사항**

- `.env`는 **git에 커밋하지 마세요** (`.gitignore`에 이미 포함됨)
- `POSTGRES_PASSWORD`, `AIRFLOW_ADMIN_PASSWORD`는 운영 환경에서 추측 불가능한 값으로 변경
- 비밀번호 변경 후엔 `docker compose down -v && docker compose up -d --build`로 볼륨 재생성 권장 (기존 DB의 user 자격은 초기화 안 됨)

## 3. Platform 실행

**First execution**

```
docker compose up --build
```

or background execution

```
docker compose up -d --build
```

**Start existing containers**

```
docker compose up -d
```

**Restart services**

```
docker compose restart
```

**Stop services**

```
docker compose down
```

**View logs**

```
docker compose logs -f
```

Specific service logs:

```
docker compose logs -f digital-brain
docker compose logs -f digital-connector
```

## Service Endpoints

After the platform starts, the following services become available.
| Service | URL |
| --------------------- | ---------------------------------------------- |
| Airflow Web UI | [http://localhost:8080](http://localhost:8080) |
| Kafka Connect API | [http://localhost:8083](http://localhost:8083) |
| Flink Web UI | [http://localhost:8081](http://localhost:8081) |
| Digital Brain API | [http://localhost:1213](http://localhost:1213) |
| Digital Connector API | [http://localhost:1219](http://localhost:1219) |

## Container Status

Check running containers:

```
docker compose ps
```

Example output:

```
federatedtwin-postgres
federatedtwin-kafka
federatedtwin-kafka-connect
federatedtwin-mqtt
federatedtwin-flink
federatedtwin-digital-brain
federatedtwin-digital-connector
federatedtwin-airflow-webserver
federatedtwin-airflow-scheduler
```

---
