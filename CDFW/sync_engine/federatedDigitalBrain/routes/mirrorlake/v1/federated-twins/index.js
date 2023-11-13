const express = require("express");
const asyncify = require("express-asyncify");
const router = asyncify(express.Router());
const services = require("../../../../services");
const ErrorHandler = require("../../../../lib/error-handler");
const auth = require("../../../../middlewares/auth");
const joi = require("../../../../middlewares/joi");
/**
 * federated-digital-twins Creation
 * localhost:1203/mirrorlake/v1/federated-twins
 *
 * @body {String} federatedDigitalTwinID (system)
 * @body {String} federatedDigitalTwinName (required)
 * @body {String} pointOfAccess (required)
 * @body {String} description (required)
 * @body {JSON} owner (required)
 * @body {String} tag (required)
 * @body {String} creationTime (system)
 * @body {String} creatorID (required)
 * @body {String} modificationTime (system)
 * @body {JSON} location (optional)
 * @body {integer} numberOfFDTObjs (system)
 * @body {integer} numberOfSubscriptions (system)
 * @body {integer} numberOfServices (system)
 * @body {integer} numberOfSimulations (system)
 * @body {integer} numberOfDTs (system)
 * @returns {Json} {}
 */
router.post("/", joi.federatedDigitalTwins.create, async function (req, res) {
   try {
      const result = await services.federatedDigitalTwins.create(req.body);
      res.success(201, result);
   } catch (e) {
      if (!(e instanceof ErrorHandler)) {
         logger.error(e);
         e = new ErrorHandler(500, 500, "Internal Server Error");
      }
      e.handle(req, res, `POST /mirrorlake/v1/federated-twins ${e}`);
   }
});

/**
 * federated-digital-twins metaData export
 * localhost:1203/mirrorlake/v1/federated-twins/meta
 * ?name=SIcrain
 * @query {string} name (required)
 * @returns {Json} {}
 */
router.get("/:federated_twin_id/export", async (req, res) => {
   try {
      const { federated_twin_id } = req.params;
      let result = await services.federatedDigitalTwins.Export({
         federated_twin_id,
      });
      res.success(200, result);
   } catch (e) {
      if (!(e instanceof ErrorHandler)) {
         logger.error(e);
         e = new ErrorHandler(500, 500, "Internal Server Error");
      }
      e.handle(req, res, `Retrieve /mirrorlake/v1/federated-twins`);
   }
});

/**
 * digital-twins Search
 * localhost:1203/mirrorlake/v1/federated-twins
 * ?name=SIcrain
 * @query {string} name (required)
 * @returns {Json} {}
 */

router.get("/", async (req, res) => {
   try {
      const { name } = req.query;
      let result;
      if (name) {
         result = await services.federatedDigitalTwins.Search({ name });
      } else {
         result = await services.federatedDigitalTwins.getAll();
      }

      res.success(200, result);
   } catch (e) {
      if (!(e instanceof ErrorHandler)) {
         logger.error(e);
         e = new ErrorHandler(500, 500, "Internal Server Error");
      }
      e.handle(req, res, `Retrieve /mirrorlake/v1/federated-twins`);
   }
});

/**
 * federated-digital-twins Retrieve
 * localhost:1203/mirrorlake/v1/federated-digital-twins
 * ?name=SIcrain
 * @param {string} federated_twin_id (required)
 * @returns {Json} {}
 */
router.get("/:federated_twin_id", async (req, res) => {
   try {
      const { federated_twin_id } = req.params;
      const result = await services.federatedDigitalTwins.Retrieve({
         federated_digital_twin_id: federated_twin_id,
      });

      res.success(200, result);
   } catch (e) {
      if (!(e instanceof ErrorHandler)) {
         logger.error(e);
         e = new ErrorHandler(500, 500, "Internal Server Error");
      }
      e.handle(req, res, `Retrieve /mirrorlake/v1/federated-twins`);
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
   "/:federated_twin_id",
   joi.federatedDigitalTwins.update,
   async function (req, res) {
      try {
         const { federated_twin_id } = req.params;
         const result = await services.federatedDigitalTwins.update(
            federated_twin_id,
            req.body
         );

         res.success(201, result);
      } catch (e) {
         if (!(e instanceof ErrorHandler)) {
            logger.error(e);
            e = new ErrorHandler(
               500,
               500,
               "Internal Server Error of patch reqest"
            );
         }
         e.handle(req, res, `PUT /mirrorlake/v1/federated-twins ${e}`);
      }
   }
);

/**
 * federated-digital-twins delete
 * localhost:1203/mirrorlake/v1/federated-twins
 * ?name=SIcrain
 * @param {string} name (required)
 * @returns {Json} {}
 */
router.delete("/:federated_twin_id", async (req, res) => {
   try {
      const { federated_twin_id } = req.params;
      const result = await services.federatedDigitalTwins.delete({
         id: federated_twin_id,
      });

      res.success(200, result);
   } catch (e) {
      if (!(e instanceof ErrorHandler)) {
         logger.error(e);
         e = new ErrorHandler(500, 500, "Internal Server Error of delete FDT");
      }
      e.handle(req, res, `Delete /mirrorlake/v1/federated-twins`);
   }
});

const receiveFederatedDigitalTwinId = (req, res, next) => {
   req.federated_twin_id = req.params.federated_twin_id;
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
