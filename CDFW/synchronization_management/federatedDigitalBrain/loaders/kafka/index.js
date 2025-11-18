// kafka/init.js (예시: 기존 파일에 그대로 대체)
const { Kafka, logLevel, Partitioners } = require("kafkajs");
const config = require("../../config");
const Model = require("../../models");
const model = new Model();

function parseBrokers(csv) {
  if (!csv) return [];
  return csv
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

exports.init = async () => {
  // KafkaJS 클라이언트/프로듀서 생성
  const brokers = parseBrokers(config.kafka.host);
  global.kafka = new Kafka({
    clientId: "federated-digital-twin",
    brokers,
    logLevel: logLevel.NOTHING, // 필요시 커스텀 로그 creator로 교체 가능
    retry: { retries: 5 },
  });

  global.client = global.kafka; // 호환용: 다른 코드가 client를 참조할 수 있어 alias 유지
  global.producer = global.kafka.producer({
    // kafka-node의 partitionerType=3(키 기반)을 대체: Legacy(해시) 파티셔너
    createPartitioner: Partitioners.LegacyPartitioner,
    allowAutoTopicCreation: true,
  });

  try {
    await global.producer.connect();
    logger.info("KafkaJS Producer connected");
  } catch (err) {
    logger.error("KafkaJS Producer connect error:", err);
    throw err;
  }

  // KafkaJS 이벤트 훅 (선택)
  global.producer.on(global.producer.events.CONNECT, (e) => {
    logger.info(`KafkaJS producer CONNECT: ${e?.timestamp || ""}`);
  });
  global.producer.on(global.producer.events.DISCONNECT, (e) => {
    logger.warn(`KafkaJS producer DISCONNECT: ${e?.timestamp || ""}`);
  });
  global.producer.on(global.producer.events.REQUEST_TIMEOUT, (e) => {
    logger.error(`KafkaJS REQUEST_TIMEOUT: ${e?.broker || ""}`);
  });

  // === 이하 기존 로직 유지 ===
  try {
    const status = await model.kafka.GetConnectorCheck({
      connectors: [
        "DigitalBase_latestFederatedDigitalObjects",
        "DigitalBase_UnalliedDigitalObjects",
        "DigitalBase_do_control_result",
        "DigitalBase_fdo_control_result",
      ],
    });

    if (!status) {
      await model.kafka.createPostgresSinkConnector({
        topic: "latestFederatedDigitalObjects",
        type: "federated_digital_object",
        table: "federated_digital_object_data",
      });
      await model.kafka.createPostgresSinkConnector({
        topic: "UnalliedDigitalObjects",
        type: "UnalliedDigitalObjects",
        table: "digital_object_data",
      });
      // await model.kafka.createPostgresSinkConnector({
      //   topic: "do_control_result",
      //   type: "do_control_result",
      //   table: "digital_object_control_result",
      // });
      await model.kafka.createPostgresSinkConnector({
        topic: "fdo_control_result",
        type: "fdo_control_result",
        table: "federated_control_result",
      });
    }

    const selectSourceConnectorSQL = `SELECT distinct(connector_id) FROM connectors;`;
    const SourceConnectors = await model.postgres.selectDataS({
      sql: selectSourceConnectorSQL,
    });

    await model.kafka.checkAndCreateConnector(
      SourceConnectors,
      async (connector) => {
        const selectSourceConnectorsSQL = `SELECT * FROM connectors where connector_id = '${connector.connector_id}';`;
        const selectSourceConnectors = await model.postgres.selectDataS({
          sql: selectSourceConnectorsSQL,
        });

        if (selectSourceConnectors.length > 0) {
          const base_urls = selectSourceConnectors
            .map((c) => c.base_url)
            .join(",");
          const digital_object_ids = selectSourceConnectors
            .map((c) => c.digital_object_id)
            .join(",");
          const digital_twin_ids = selectSourceConnectors
            .map((c) => c.digital_twin_id)
            .join(",");
          const change_urls = selectSourceConnectors
            .map((c) => c.change_url)
            .join(",");
          const poll_interval = selectSourceConnectors[0].poll_interval;

          const sinkConfig = {
            name: connector.connector_id,
            base_url: base_urls,
            change_urls,
            digital_object_ids,
            digital_twin_ids,
            digital_object_data_interval: poll_interval,
          };
          await model.kafka.createSourceHttpConnectorGroup(sinkConfig);
        }
      }
    );
  } catch (e) {
    logger.error("Kafka init flow error:", e);
    throw e;
  }
};
