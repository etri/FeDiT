/**
 * FederatedTwin Configuration
 * Supports Docker environment variables (.env)
 */

const env = (key, def) => process.env[key] || def;
const num = (key, def) => Number(process.env[key] || def);

/**
 * window된 디오 데이터 생성용 flink table config
 * default term: [0]
 */
exports.setWindowDOtable = {
  term: [0, 10, 60],
}; //term 마다 디오 테이블 생성

/**
 * nginx (optional)
 */
exports.nginx = {
  url: env("NGINX_URL", null),
  ip: env("NGINX_IP", null),
  port: env("NGINX_PORT", null),
  base: env("NGINX_BASE", null),
};

exports.type = {
  fedit: 0,
  federatedDigitalTwin: 1,
  federatedDigitalObject: 2,
  digitalObject: 3,
  controller: 4,
  visualModel: 5,
  dataModel: 6,
  behaviorModel: 7,
  simulation: 8,
  service: 9,
  subscription: 10,
};

/**
 * Federated Digital Brain
 */
exports.federatedDigitalBrain = {
  ip: env("BRAIN_HOST", "localhost"),
  port: env("BRAIN_PORT", "1213"),
  base: "fedit/v1/federated-twins",
};

/**
 * Federated Digital Connector
 */
exports.federatedDigitalConnector = {
  ip: env("CONNECTOR_HOST", "localhost"),
  port: env("CONNECTOR_PORT", "1219"),
  base: "fedit/v1",
};

/**
 * Log Server
 */
exports.logServer = {
  ip: env("LOG_SERVER_IP", "localhost"),
  port: env("LOG_SERVER_PORT", "7890"),
  projectName: env("LOG_PROJECT", "LAKE"),
  serverName: env("LOG_SERVER_NAME", "BR"),
};

/**
 * MQTT
 */
exports.mqtt = {
  ip: env("MQTT_HOST", "localhost"),
  port: env("MQTT_PORT", "1883"),
};

/**
 * Kafka
 */
exports.kafka = {
  host: env("KAFKA_HOST", "localhost:9092"),
  connectHost: env("KAFKA_CONNECT_HOST", "localhost:8083"),
};

/**
 * (default) mode = none, total_rows = 0, scan_partition_num = 1 이면 → 1개의 Job 생성, 조건 없음
 * mode 설정에 따라 파티션 나누기 방식이 다름
 *   - "none": 파티션 나누지 않고 전체 대상
 *   - "numeric": compose_numeric_id 기준으로 범위 나누기
 *   - "hash": federated_digital_object_id를 해시하여 파티션 나누기
 *   - "RoundRobin": federated_digital_object_id의 마지막 숫자로 파티션 나누기
 */
exports.flink = {
  ksqlOptions: {
    hostname: env("KSQL_HOST", "localhost"),
    port: num("KSQL_PORT", 8088),
    headers: {
      "Content-Type": "application/vnd.ksql.v1+json",
      Accept: "application/vnd.ksql.v1+json",
    },
  },

  gwOption: {
    host: env("FLINK_GATEWAY_HOST", "localhost:8087"),
    hostname: env("FLINK_GATEWAY_HOSTNAME", "localhost"),
    port: num("FLINK_GATEWAY_PORT", 8087),
  },

  sedonaJarLocation: env(
    "SEDONA_JAR_PATH",
    "/opt/flink/lib/sedona-flink-shaded_2.12-1.5.1-SNAPSHOT.jar",
  ),

  total_rows: num("FLINK_TOTAL_ROWS", 0),
  scan_partition_num: num("FLINK_SCAN_PARTITION_NUM", 0),
  mode: env("FLINK_PARTITION_MODE", "none"),
};

/**
 * PostgreSQL connection pool
 */
exports.postgresPool = {
  host: env("POSTGRES_HOST", "localhost"),
  port: num("POSTGRES_PORT", 5432),
  user: env("POSTGRES_USER", "postgres"),
  password: env("POSTGRES_PASSWORD", "postgres"),
  database: env("POSTGRES_DB", "federated_digital_twin"),

  max: num("POSTGRES_POOL_MAX", 20),
  idleTimeoutMillis: num("POSTGRES_IDLE_TIMEOUT", 30000),
  connectionTimeoutMillis: num("POSTGRES_CONN_TIMEOUT", 2000),
};

exports.multer = {
  uploadFolder: env("UPLOAD_FOLDER", "visual-model-assets/"),
  fileSizeLimit: num("UPLOAD_MAX_SIZE", 100 * 1024 * 1024),
  allowMimetype: [
    ".fbx",
    ".dae",
    ".3ds",
    ".dxf",
    ".obj",
    ".ma",
    ".mb",
    ".max",
    ".c4d",
    ".blend",
    ".bmp",
    ".tif",
    ".tga",
    ".jpg",
    ".jpeg",
    ".psd",
    ".png",
    ".zip",
  ],
};
