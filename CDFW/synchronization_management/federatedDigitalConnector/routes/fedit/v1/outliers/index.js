const express = require("express");
const asyncify = require("express-asyncify");
const router = asyncify(express.Router());
const services = require("../../../../services");
const ErrorHandler = require("../../../../lib/error-handler");
const auth = require("../../../../middlewares/auth");
const joi = require("../../../../middlewares/joi");

router.post("/", async function (req, res) {
   try {
      const result = await services.dataLinkage.outlier(req.body);
      res.success(201, result);
   } catch (e) {
      if (!(e instanceof ErrorHandler)) {
         logger.error(e);
         e = new ErrorHandler(500, 500, "Internal Server Error");
      }
      e.handle(req, res, `POST /fedit/v1/outliers ${e}`);
   }
});

module.exports = router;
