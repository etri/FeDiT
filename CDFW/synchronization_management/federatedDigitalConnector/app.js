const path = require("path");
require("dotenv").config({
  path: path.resolve(__dirname, "../.env.node"),
  quiet: true,
});
const express = require("express");
const loaders = require("./loaders");

const app = express();

async function start() {
  await loaders.start({ app });
  require("./routes")(app);
}
start();

module.exports = app;
