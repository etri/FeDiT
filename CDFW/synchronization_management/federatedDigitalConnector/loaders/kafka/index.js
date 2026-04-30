const kafka = require("kafka-node");
const config = require("../../config");

exports.init = () => {
   const HighLevelProducer = kafka.HighLevelProducer;
   global.client = new kafka.KafkaClient({
      kafkaHost: config.kafka.host,
   });
   global.producer = new HighLevelProducer(client, {
      partitionerType: 3,
   });
   producer.on("ready", function () {
      logger.info("> Kafka Producer is on ready");
   });
   producer.on("error", function (err) {
      logger.error("error" + err);
   });
};
