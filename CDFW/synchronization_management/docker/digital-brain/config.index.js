/**
 * Docker config - federatedDigitalBrain
 */

exports.setWindowDOtable = {
  term: [0, 10, 60],
};

exports.nginx = {
  url: null,
  ip: null,
  port: null,
  base: null,
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

exports.federatedDigitalBrain = {
  ip: "digital-brain",
  port: "1213",
  base: "fedit/v1/federated-twins",
};

exports.federatedDigitalConnector = {
  ip: "digital-connector",
  port: "1219",
  base: "fedit/v1",
};

exports.logServer = {
  ip: "host.docker.internal",
  port: "7890",
  projectName: "LAKE",
  serverName: "BR",
};

exports.mqtt = {
  ip: "mqtt",
  port: "1883",
};

exports.kafka = {
  host: "kafka:9092",
  connectHost: "kafka-connect:8083",
};

exports.flink = {
  ksqlOptions: {
    hostname: "host.docker.internal",
    port: 8088,
    headers: {
      "Content-Type": "application/vnd.ksql.v1+json",
      Accept: "application/vnd.ksql.v1+json",
    },
  },
  gwOption: {
    host: "flink:8087",
    hostname: "flink",
    port: 8087,
  },
  sedonaJarLocation:
    "/opt/flink/lib/sedona-flink-shaded_2.12-1.5.1-SNAPSHOT.jar",
  total_rows: 0,
  scan_partition_num: 0,
  mode: "none",
};

exports.postgresPool = {
  host: process.env.POSTGRES_HOST || "postgres",
  port: Number(process.env.POSTGRES_PORT || 5432),
  user: process.env.POSTGRES_USER || "postgres",
  password: process.env.POSTGRES_PASSWORD || "keti123",
  database: process.env.POSTGRES_DB || "federated_digital_twin",
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

exports.multer = {
  uploadFolder: "visual-model-assets/",
  fileSizeLimit: 100 * 1024 * 1024,
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
