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
      model.kafka.createPostgresSinkConnector({
         topic: "do_control_result",
         type: "do_control_result",
         table: "digital_object_control_result",
      });
      model.kafka.createPostgresSinkConnector({
         topic: "fdo_control_result",
         type: "fdo_control_result",
         table: "federated_control_result",
      });
   }
};
