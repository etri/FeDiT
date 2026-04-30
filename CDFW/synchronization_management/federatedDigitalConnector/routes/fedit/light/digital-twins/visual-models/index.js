const express = require("express");
const asyncify = require("express-asyncify");
const router = asyncify(express.Router());
const services = require("../../../../../services");
const ErrorHandler = require("../../../../../lib/error-handler");
const joi = require("../../../../../middlewares/joi");
/**
 * visualModel Creation
 */
router.post("/", joi.visualModelsLight.create, async function (req, res) {
  try {
    const { digital_twin_id } = req;
    const result = await services.visualModels.create(
      digital_twin_id,
      req.body,
    );

    res.success(201, result);
  } catch (e) {
    if (!(e instanceof ErrorHandler)) {
      logger.error(e);
      e = new ErrorHandler(
        500,
        500,
        "Internal Server Error of creating visualModel",
      );
    }
    e.handle(
      req,
      res,
      `POST /fedit/v1/digital-twins/{digital_twin_id}/visualModels ${e}`,
    );
  }
});

module.exports = router;
