const { dir } = require("console");
const express = require("express");
const asyncify = require("express-asyncify");
const router = asyncify(express.Router());
const services = require("../../../services");
const ErrorHandler = require("../../../lib/error-handler");
const fs = require("fs");

/**
 * digital_object_id로 상위 digital_twin 정보 조회
 * @param {string} digital_object_id
 * @returns {Json}
 */
router.get("/digital-objects/:digital_object_id", async (req, res) => {
  try {
    const { digital_object_id } = req.params;
    const result = await services.digitalObjects.SearchTwinByObjectId({
      digital_object_id,
    });

    res.success(201, result);
  } catch (e) {
    if (!(e instanceof ErrorHandler)) {
      logger.error(e);
      e = new ErrorHandler(500, 500, "Internal Server Error");
    }
    e.handle(req, res, `get /fedit/v1/digital-objects`);
  }
});

const dirs = fs
  .readdirSync(__dirname)
  .filter((d) => fs.lstatSync(__dirname + "/" + d).isDirectory());
dirs.forEach((dir) => {
  const r = require("./" + dir);
  router.use(`/${dir}`, r);
});

module.exports = router;
