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
         title: "MirrorLake v1 DigitalConnector",
         version: "1.0.0",
         description: "MirrorLake/digital-connector/v1 API",
      },
      host: "localhost:1209",
      basePath: "/digital-connector/v1/",
   },
   apis: [
      "./routes/*.js",
      "./routes/digital-connector/*.js",
      "./routes/digital-connector/v1/*.js",
      "./routes/digital-connector/v1/sensors/*.js",
      "./routes/digital-connector/v1/controllers/*.js",
      "./swagger/*",
   ], //   apis: ["./routes/*.js", "./swagger/*"],
};

const specs = swaggereJsdoc(options);

module.exports = {
   swaggerUi,
   specs,
};
