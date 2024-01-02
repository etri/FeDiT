/**
 * window된 디오 데이터 생성용 flink table config
 * default term: [0]
 */
exports.setWindowDOtable = {
   term: [0, 1, 10, 60],
}; //term 마다 디오 테이블 생성

exports.setSedonaFlinkFunc = {
   jarLocation:
      "/home/cotlab/flink-release-1.17.0/build-target/lib/sedona-flink-shaded_2.12-1.5.1-SNAPSHOT.jar",
};

exports.nginx = {
   url: null,
   ip: "175.45.195.227",
   port: "1221",
   base: "mirrorlake/v1/digital-twins",
};

exports.type = {
   mirrorlake: 0,
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

exports.mirrorlake = {
   id: "M423c90f0157b22b0bd61e4132e6ff37e",
   digital_twin_id: "D410c5c8a19905787b8029ef49fe96c53",
};

exports.digitalBrain = {
   ip: "localhost",
   port: "1203",
   base: "mirrorlake/v1/digital-twins",
};

exports.digitalConnector = {
   ip: "localhost",
   port: "1209",
   base: "mirrorlake/v1/digital-twins",
};

exports.federatedDigitalBrain = {
   ip: "localhost",
   port: "1213",
   base: "mirrorlake/v1/digital-twins",
};

exports.federatedDigitalConnector = {
   ip: "localhost",
   port: "1219",
   base: "mirrorlake/v1/digital-twins",
};

/**
 * 네이밍 규칙 만들기 (abbreviation)
 */
exports.logServer = {
   ip: "192.168.140.123",
   port: "7890",
   projectName: "LAKE",
   serverName: "BR",
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

exports.multer = {
   // uploadFolder: "/home/cotlab/mirrorlake/visual-model-assets/",
   uploadFolder: "D:/GitHub/MirrorLake/visual-model-assets/",
   fileSizeLimit: 100 * 1024 * 1024, // 100mb
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
