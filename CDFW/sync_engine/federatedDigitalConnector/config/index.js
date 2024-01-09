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
   ip: "localhost",
   port: "1213",
   base: "fedit/v1/digital-twins",
};

exports.federatedDigitalConnector = {
   ip: "localhost",
   port: "1219",
   base: "fedit/v1/digital-twins",
};

/**
 * 네이밍 규칙 만들기 (abbreviation)
 */
exports.logServer = {
   ip: "192.168.140.123",
   port: "7890",
   projectName: "LAKE",
   serverName: "CN",
};

exports.mqtt = {
   ip: "localhost",
   port: "1883",
};

exports.kafka = {
   host: "192.168.140.123:9092",
   connectHost: "192.168.140.123:8083",
};

exports.flink = {
   ksqlOptions: {
      hostname: "localhost",
      port: 8088,
      headers: {
         "Content-Type": "application/vnd.ksql.v1+json",
         Accept: "application/vnd.ksql.v1+json",
      },
   },
   gwOption: {
      host: "192.168.140.123:8087",
      hostname: "192.168.140.123",
      port: 8087,
   },
};

exports.postgresPool = {
   host: "192.168.140.123",
   port: 5432,
   user: "postgres",
   password: "keti123",
   database: "federated_digital_twin",
   max: 20,
   idleTimeoutMillis: 30000,
   connectionTimeoutMillis: 2000,
};
