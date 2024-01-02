const express = require("express");
const asyncify = require("express-asyncify");
const router = asyncify(express.Router());
const fs = require("fs");

const receiveFederatedDigitalTwinId = (req, res, next) => {
   req.federated_digital_twin_id = req.params.federated_twin_id;
   next();
};

const dirs = fs
   .readdirSync(__dirname)
   .filter((d) => fs.lstatSync(__dirname + "/" + d).isDirectory());
dirs.forEach((dir) => {
   const r = require("./" + dir);
   router.use(`/:federated_twin_id/${dir}`, receiveFederatedDigitalTwinId, r);
});

module.exports = router;
