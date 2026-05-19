process.env.KAFKAJS_NO_PARTITIONER_WARNING = "1";
const { Kafka, logLevel } = require("kafkajs");
const config = require("../../config");
const Model = require("../../models");
const model = new Model();

exports.init = async () => {
  try {
    const brokers = config.kafka.host.split(",").map((s) => s.trim());

    const kafka = new Kafka({
      clientId: "federated-digital-brain",
      brokers,
      logLevel: logLevel.WARN,
      connectionTimeout: 10000,
      requestTimeout: 30000,
      retry: {
        initialRetryTime: 1000,
        retries: 8,
        factor: 2,
        maxRetryTime: 30000,
      },
    });

    const producer = kafka.producer({
      allowAutoTopicCreation: true,
      retry: { retries: 5 },
    });
    const admin = kafka.admin();

    await producer.connect();
    await admin.connect();

    producer.on(producer.events.CONNECT, () => {
      logger.info(`Kafka producer connected (brokers=${brokers.join(",")})`);
    });
    producer.on(producer.events.DISCONNECT, () => {
      logger.warn(
        `Kafka producer disconnected (brokers=${brokers.join(",")})`
      );
    });
    producer.on(producer.events.REQUEST_TIMEOUT, (e) => {
      logger.error(
        `Kafka producer request timeout (brokers=${brokers.join(",")}): ${
          e?.payload?.broker ?? ""
        }`
      );
    });

    global.kafka = kafka;
    global.producer = producer;
    global.admin = admin;

    const gracefulShutdown = async () => {
      try {
        await producer.disconnect();
        await admin.disconnect();
      } catch (e) {
        logger.error(`Kafka graceful shutdown error: ${e.message}`);
      }
    };
    process.once("SIGINT", gracefulShutdown);
    process.once("SIGTERM", gracefulShutdown);

    logger.info("Kafka Producer is on ready");

    const status = await model.kafka.GetConnectorCheck({
      connectors: [
        "DigitalBase_latestFederatedDigitalObjects",
        "DigitalBase_UnalliedDigitalObjects",
        "DigitalBase_fdo_control_result",
      ],
    });
    if (!status) {
      model.kafka.createPostgresSinkConnector({
        topic: "latestFederatedDigitalObjects",
        type: "federated_digital_object",
        table: "federated_digital_object_data",
      });
      model.kafka.createPostgresSinkConnector({
        topic: "UnalliedDigitalObjects",
        type: "UnalliedDigitalObjects",
        table: "digital_object_data",
      });
      model.kafka.createPostgresSinkConnector({
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
      },
    );
  } catch (error) {
    logger.error(`[KAFKA] ${error}`);
  }
};
