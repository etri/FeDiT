const globalLoader = require("./global");
const expressLoader = require("./express");
const kafkaLoader = require("./kafka");
const flinkLoader = require("./flink");
const mqttLoader = require("./mqtt");
const postgresLoader = require("./postgres");
const multerLoader = require("./multer");
//const logger = require("../lib/logger")

exports.start = async ({ app }) => {
   globalLoader.init();
   postgresLoader.init();
   kafkaLoader.init();
   flinkLoader.init();
   mqttLoader.init();
   expressLoader.init({ app });
   multerLoader.init();
   logger.info("all loaders initialized");
};
