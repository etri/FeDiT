/**
 * Docker config - federatedDigitalConnector
 */

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

exports.nginx = {
  url: null,
  ip: null,
  port: null,
  base: null,
};

exports.federatedDigitalBrain = {
  ip: "digital-brain",
  port: "1213",
  base: "fedit/v1/federated-twins",
};

exports.federatedDigitalConnector = {
  ip: "digital-connector",
  port: "1219",
  base: "fedit/v1/federated-twins",
};

exports.logServer = {
  ip: "host.docker.internal",
  port: "7890",
  projectName: "LAKE",
  serverName: "CN",
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
