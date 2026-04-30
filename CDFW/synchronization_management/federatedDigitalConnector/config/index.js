/**
 * FederatedTwin Configuration
 * Supports Docker environment variables (.env)
 */

const env = (key, def) => process.env[key] || def;
const num = (key, def) => Number(process.env[key] || def);

/**
 * nginx (optional)
 */
exports.nginx = {
  url: env("NGINX_URL", null),
  ip: env("NGINX_IP", null),
  port: env("NGINX_PORT", null),
  base: env("NGINX_BASE", null),
};

// federatedDigitalConnector config
exports.type = {
  federatedigitalTwin: 0,
  digitalTwin: 1,
  digitalObject: 2,
  sensor: 3,
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
 * Flink configuration
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
