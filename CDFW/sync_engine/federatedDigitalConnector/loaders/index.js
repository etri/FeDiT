const globalLoader = require("./global");
const expressLoader = require("./express");
const mqttLoader = require("./mqtt");
const kafkaLoader = require("./kafka");
const flinkLoader = require("./flink");
const postgresLoader = require("./postgres");
const logger = require("../lib/logger");

exports.start = async ({ app }) => {
   globalLoader.init();
   expressLoader.init({ app });
   mqttLoader.init();
   kafkaLoader.init();
   flinkLoader.init();
   postgresLoader.init();

   logger.info("all loaders initialized");
};
