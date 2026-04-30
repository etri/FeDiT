const express = require("express");
const asyncify = require("express-asyncify");
const router = asyncify(express.Router());
const services = require("../../../../services");
const ErrorHandler = require("../../../../lib/error-handler");
const auth = require("../../../../middlewares/auth");
const joi = require("../../../../middlewares/joi");
const fs = require("fs");
/**
 * digital-twins Creation
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
      const result = await services.digitalTwins.create(req.body);
      res.success(201, result);
   } catch (e) {
      if (!(e instanceof ErrorHandler)) {
         logger.error(e);
         e = new ErrorHandler(500, 500, "Internal Server Error");
      }
      e.handle(req, res, `POST /fedit/v1/digital-twins ${e}`);
   }
});

/**
 * digital-twins metaData export
 * @query {string} name (required)
 * @returns {Json} {}
 */
router.get("/:digital_twin_id/export", async (req, res) => {
   try {
      const { digital_twin_id } = req.params;
      let result = await services.digitalTwins.Export({
         digital_twin_id,
      });
      res.success(200, result);
   } catch (e) {
      if (!(e instanceof ErrorHandler)) {
         logger.error(e);
         e = new ErrorHandler(500, 500, "Internal Server Error");
      }
      e.handle(req, res, `Retrieve /fedit/v1/digital-twins`);
   }
});

/**
 * digital-twins Search
 * @query {string} name (required)
 * @returns {Json} {}
 */
router.get("/", async (req, res) => {
   try {
      const { name } = req.query;
      let result;
      if (name) {
         result = await services.digitalTwins.Search({
            name,
         });
      } else {
         result = await services.digitalTwins.getAll({});
      }

      res.success(200, result);
   } catch (e) {
      if (!(e instanceof ErrorHandler)) {
         logger.error(e);
         e = new ErrorHandler(500, 500, "Internal Server Error");
      }
      e.handle(req, res, `Retrieve /fedit/v1/digital-twins`);
   }
});

/**
 * digital-twins Sensor Data Count For Monitoring WEB
 * ?name=SIcrain
 * @param {string} name (required)
 * @returns {Json} {}
 */

router.get("/data_count", async (req, res) => {
   try {
      const { from } = req.query;
      const result = await services.digitalTwins.retrieveSensorDataCount({
         from,
      });

      res.success(201, result);
   } catch (e) {
      if (!(e instanceof ErrorHandler)) {
         logger.error(e);
         e = new ErrorHandler(500, 500, "Internal Server Error");
      }
      e.handle(req, res, `Get /fedit/v1/digital-twins/data_count`);
   }
});

router.get("/data_count_all", async function (req, res) {
   try {
      const result = await services.digitalTwins.retrieveSensorDataCountAll();
      res.success(201, result);
   } catch (e) {
      if (!(e instanceof ErrorHandler)) {
         logger.error(e);
         e = new ErrorHandler(500, 500, "Internal Server Error");
      }
      e.handle(req, res, `Get /fedit/v1/digital-twins/data_count_all`);
   }
});

/**
 * digital-twins Retrieve
 * @param {string} digital_twin_id (required)
 * @returns {Json} {}
 */
router.get("/:digital_twin_id", async (req, res) => {
   try {
      const { digital_twin_id } = req.params;
      const result = await services.digitalTwins.Retrieve({
         digital_twin_id,
      });

      res.success(200, result);
   } catch (e) {
      if (!(e instanceof ErrorHandler)) {
         logger.error(e);
         e = new ErrorHandler(500, 500, "Internal Server Error");
      }
      e.handle(req, res, `Retrieve /fedit/v1/digital-twins`);
   }
});

/**
 * digital-twins Update
 *
 * @body
 * @returns {Json} {}
 */
router.patch(
   "/:digital_twin_id",
   joi.digitalTwins.update,
   async function (req, res) {
      try {
         const { digital_twin_id } = req.params;
         const result = await services.digitalTwins.update(
            digital_twin_id,
            req.body
         );

         res.success(201, result);
      } catch (e) {
         if (!(e instanceof ErrorHandler)) {
            logger.error(e);
            e = new ErrorHandler(500, 500, "Internal Server Error");
         }
         e.handle(req, res, `PUT /fedit/v1/digital-twins ${e}`);
      }
   }
);

/**
 * digital-twins delete
 * ?name=SIcrain
 * @param {string} name (required)
 * @returns {Json} {}
 */
router.delete("/:digital_twin_id", async (req, res) => {
   try {
      const { digital_twin_id } = req.params;
      const result = await services.digitalTwins.delete({
         digital_twin_id,
      });

      res.success(200, result);
   } catch (e) {
      if (!(e instanceof ErrorHandler)) {
         logger.error(e);
         e = new ErrorHandler(500, 500, "Internal Server Error");
      }
      e.handle(req, res, `Delete /fedit/v1/digital-twins`);
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
