process.env.KAFKAJS_NO_PARTITIONER_WARNING = "1";
const { Kafka, logLevel } = require("kafkajs");
const config = require("../../config");

exports.init = async () => {
   const brokers = config.kafka.host.split(",").map((s) => s.trim());

   const kafka = new Kafka({
      clientId: "federated-digital-connector",
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
      logger.info(`> Kafka producer connected (brokers=${brokers.join(",")})`);
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

   logger.info("> Kafka Producer is on ready");
};
