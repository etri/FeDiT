const kafka = require("kafka-node");
const config = require("../../config");
const Model = require("../../models");
const model = new Model();

exports.init = async () => {
   const HighLevelProducer = kafka.HighLevelProducer;
   global.client = new kafka.KafkaClient({
      kafkaHost: config.kafka.host,
   });
   global.producer = new HighLevelProducer(client, {
      partitionerType: 3,
   });
   producer.on("ready", function () {
      logger.info("Kafka Producer is on ready");
   });
   producer.on("error", function (err) {
      logger.error("error" + err);
   });

   const status = await model.kafka.GetConnectorCheck({
      connectors: [
         "DigitalBase_latestFederatedDigitalObjects",
         "DigitalBase_UnalliedDigitalObjects",
         "DigitalBase_do_control_result",
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
      // model.kafka.createPostgresSinkConnector({
      //    topic: "do_control_result",
      //    type: "do_control_result",
      //    table: "digital_object_control_result",
      // });
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
      }
   );
};
