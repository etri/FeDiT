const { dir } = require("console");
const express = require("express");
const asyncify = require("express-asyncify");
const router = asyncify(express.Router());
const services = require("../../../services");
const ErrorHandler = require("../../../lib/error-handler");
const fs = require("fs");


const dirs = fs
   .readdirSync(__dirname)
   .filter((d) => fs.lstatSync(__dirname + "/" + d).isDirectory());
//logger.info(dirs);
dirs.forEach((dir) => {
   const r = require("./" + dir);
   router.use(`/${dir}`, r);
});

module.exports = router;
