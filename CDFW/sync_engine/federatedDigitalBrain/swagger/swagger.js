const fs = require("fs");
const swaggerUi = require("swagger-ui-express");
const swaggereJsdoc = require("swagger-jsdoc");

const apis = [];
const dirs = fs.readdirSync(__dirname);
dirs
   .filter((d) => fs.lstatSync(__dirname + "/" + d).isDirectory())
   .forEach((dir) => {
      apis.push(dir);
      logger.info("apis: ", apis);
   });

const options = {
   swaggerDefinition: {
      info: {
         title: "MirrorLake v1 DigitalBrain",
         version: "1.0.0",
         description: "MirrorLake/v1/digital-brain API",
      },
      host: "localhost:1203",
      basePath: "/digital-brain/v1/",
   },
   apis: ["./routes/DigitalBrain/v1/DO/index.js", "./swagger/*"], //   apis: ["./routes/*.js", "./swagger/*"],
};

const specs = swaggereJsdoc(options);

module.exports = {
   swaggerUi,
   specs,
};
