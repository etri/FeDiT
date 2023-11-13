const express = require("express");
const loaders = require("./loaders");

const app = express();

async function start() {
   await loaders.start({ app });
   require("./routes")(app);
   require("./swagger")(app);
}
start();

module.exports = app;
