const globalLoader = require("./global");
const expressLoader = require("./express");
const mqttLoader = require("./mqtt");
const kafkaLoader = require("./kafka");
const postgresLoader = require("./postgres");
const logger = require("../lib/logger");

exports.start = async ({ app }) => {
  globalLoader.init();
  expressLoader.init({ app });
  mqttLoader.init();
  kafkaLoader.init();
  postgresLoader.init();

  logger.info("all loaders initialized");
};
