const express = require("express");
const asyncify = require("express-asyncify");
const router = asyncify(express.Router());
const services = require("../../../../../services");
const ErrorHandler = require("../../../../../lib/error-handler");
const auth = require("../../../../../middlewares/auth");
const joi = require("../../../../../middlewares/joi");
const fs = require("fs");
/**
 * digital-twins Creation
 * localhost:1203/mirrorlake/v1/digital-twins
 *
 * @body {String} digitalTwinID (system)
 * @body {String} digitalTwinName (required)
 * @body {String} pointOfAccess (required)
 * @body {String} description (required)
 * @body {JSON} owner (required)
 * @body {String} tag (required)
 * @body {String} creationTime (system)
 * @body {String} creatorID (required)
 * @body {String} modificationTime (system)
 * @body {JSON} location (optional)
 * @body {integer} numberOfDTObjs (system)
 * @body {integer} numberOfSubscriptions (system)
 * @body {integer} numberOfServices (system)
 * @body {integer} numberOfSimulations (system)
 * @body {integer} numberOfSensors (system)
 * @body {integer} numberOfControllers (system)
 * @body {integer} numberOfVisualModels (system)
 * @body {integer} numberOfDataModels (system)
 * @body {integer} numberOfBehaviorModels (system)
 * @returns {Json} {}
 */
router.post("/", joi.digitalTwins.create, async function (req, res) {
   try {
      const { federated_digital_twin_id } = req;
      const result = await services.digitalTwins.create(
         federated_digital_twin_id,
         req.body
      );
      res.success(201, result);
   } catch (e) {
      if (!(e instanceof ErrorHandler)) {
         logger.error(e);
         e = new ErrorHandler(500, 500, "Internal Server Error");
      }
      e.handle(req, res, `POST /mirrorlake/v1/digital-twins ${e}`);
   }
});

/**
 * digital-twins metaData export
 * localhost:1203/mirrorlake/v1/digital-twins/meta
 * ?name=SIcrain
 * @query {string} name (required)
 * @returns {Json} {}
 */
router.get("/:digital_twin_id/export", async (req, res) => {
   try {
      const { federated_digital_twin_id } = req;
      const { digital_twin_id } = req.params;
      let result = await services.digitalTwins.Export({
         federated_digital_twin_id,
         digital_twin_id,
      });
      res.success(200, result);
   } catch (e) {
      if (!(e instanceof ErrorHandler)) {
         logger.error(e);
         e = new ErrorHandler(500, 500, "Internal Server Error");
      }
      e.handle(req, res, `Retrieve /mirrorlake/v1/digital-twins`);
   }
});

/**
 * digital-twins Search
 * localhost:1203/mirrorlake/v1/digital-twins
 * ?name=SIcrain
 * @query {string} name (required)
 * @returns {Json} {}
 */
router.get("/", async (req, res) => {
   try {
      const { federated_digital_twin_id } = req;
      const { name } = req.query;
      let result;
      if (name) {
         result = await services.digitalTwins.Search({
            federated_digital_twin_id,
            name,
         });
      } else {
         result = await services.digitalTwins.getAll({
            federated_digital_twin_id,
         });
      }

      res.success(200, result);
   } catch (e) {
      if (!(e instanceof ErrorHandler)) {
         logger.error(e);
         e = new ErrorHandler(500, 500, "Internal Server Error");
      }
      e.handle(req, res, `Retrieve /mirrorlake/v1/digital-twins`);
   }
});

/**
 * digital-twins Retrieve
 * localhost:1203/mirrorlake/v1/digital-twins
 * ?name=SIcrain
 * @param {string} digital_twin_id (required)
 * @returns {Json} {}
 */
router.get("/:digital_twin_id", async (req, res) => {
   try {
      const { federated_digital_twin_id } = req;
      const { digital_twin_id } = req.params;
      const result = await services.digitalTwins.Retrieve({
         federated_digital_twin_id,
         digital_twin_id,
      });

      res.success(200, result);
   } catch (e) {
      if (!(e instanceof ErrorHandler)) {
         logger.error(e);
         e = new ErrorHandler(500, 500, "Internal Server Error");
      }
      e.handle(req, res, `Retrieve /mirrorlake/v1/digital-twins`);
   }
});

/**
 * digital-twins Update
 * localhost:1203/mirrorlake/v1/digital-twins
 *
 * @body
 * @returns {Json} {}
 */
router.patch(
   "/:digital_twin_id",
   joi.digitalTwins.update,
   async function (req, res) {
      try {
         const { federated_digital_twin_id } = req;
         const { digital_twin_id } = req.params;
         const result = await services.digitalTwins.update(
            federated_digital_twin_id,
            digital_twin_id,
            req.body
         );

         res.success(201, result);
      } catch (e) {
         if (!(e instanceof ErrorHandler)) {
            logger.error(e);
            e = new ErrorHandler(500, 500, "Internal Server Error");
         }
         e.handle(req, res, `PUT /mirrorlake/v1/digital-twins ${e}`);
      }
   }
);

/**
 * digital-twins delete
 * localhost:1203/mirrorlake/v1/digital-twins
 * ?name=SIcrain
 * @param {string} name (required)
 * @returns {Json} {}
 */
router.delete("/:digital_twin_id", async (req, res) => {
   try {
      const { federated_digital_twin_id } = req;
      const { digital_twin_id } = req.params;
      const result = await services.digitalTwins.delete({
         federated_digital_twin_id,
         digital_twin_id,
      });

      res.success(200, result);
   } catch (e) {
      if (!(e instanceof ErrorHandler)) {
         logger.error(e);
         e = new ErrorHandler(500, 500, "Internal Server Error");
      }
      e.handle(req, res, `Delete /mirrorlake/v1/digital-twins`);
   }
});

const receiveDigitalTwinId = (req, res, next) => {
   req.digital_twin_id = req.params.digital_twin_id;
   next();
};

const dirs = fs
   .readdirSync(__dirname)
   .filter((d) => fs.lstatSync(__dirname + "/" + d).isDirectory());
dirs.forEach((dir) => {
   const r = require("./" + dir);
   router.use(`/:digital_twin_id/${dir}`, receiveDigitalTwinId, r);
});

module.exports = router;
