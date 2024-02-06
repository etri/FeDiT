const express = require("express");
const asyncify = require("express-asyncify");
const router = asyncify(express.Router());
const services = require("../../../../../services");
const ErrorHandler = require("../../../../../lib/error-handler");
const auth = require("../../../../../middlewares/auth");
const joi = require("../../../../../middlewares/joi");
/**
 * FDO Creation (federated Digital Object Creation)
 */
router.post("/", joi.federatedDigitalObjects.create, async function (req, res) {
   try {
      const { federated_digital_twin_id } = req;
      const result = await services.federatedDigitalObjects.create(
         federated_digital_twin_id,
         req.body
      );

      res.success(201, result);
   } catch (e) {
      if (!(e instanceof ErrorHandler)) {
         logger.error(e);
         e = new ErrorHandler(
            500,
            500,
            "Internal Server Error of FDO Creation"
         );
      }
      e.handle(
         req,
         res,
         `POST /fedit/v1/federated_twins/{federated_digital_twin_id}/federated_digital_objects ${e}`
      );
   }
});

/**
 * federated-digital-object Search
 * localhost:1203/fedit/v1/federated-twins/{federated_digital_twin_id}/federated_digital_objects/{federated_digital_object_id}
 * ?name=SIcrain
 * @param {string} name (required)
 * @returns {Json} {}
 */
router.get("/", async (req, res) => {
   try {
      const { federated_digital_twin_id } = req;
      const { name } = req.query;
      let result;
      if (name) {
         result = await services.federatedDigitalObjects.Search({
            federated_digital_twin_id,
            name,
         });
      } else {
         result = await services.federatedDigitalObjects.getAll({
            federated_digital_twin_id,
         });
      }
      res.success(200, result);
   } catch (e) {
      if (!(e instanceof ErrorHandler)) {
         logger.error(e);
         e = new ErrorHandler(500, 500, "Internal Server Error of search FDO");
      }
      e.handle(
         req,
         res,
         `Search /fedit/v1/federated-twins/{federated_digital_twin_id}/federated_digital_objects/{federated_digital_object_id}`
      );
   }
});

/**
 * federated-digital-object Retrieve
 * localhost:1203/fedit/v1/federated-twins/{federated_digital_twin_id}/federated_digital_objects/{federated_digital_object_id}
 * ?name=SIcrain
 * @param {string} federated_digital_object_id (required)
 * @returns {Json} {}
 */
router.get("/:federated_digital_object_id", async (req, res) => {
   try {
      const { federated_digital_twin_id } = req;
      const { federated_digital_object_id } = req.params;
      const result = await services.federatedDigitalObjects.Retrieve({
         federated_digital_twin_id,
         federated_digital_object_id,
      });

      res.success(200, result);
   } catch (e) {
      if (!(e instanceof ErrorHandler)) {
         logger.error(e);
         e = new ErrorHandler(
            500,
            500,
            "Internal Server Error of retrieve FDO"
         );
      }
      e.handle(
         req,
         res,
         `Retrieve /fedit/v1/federated-twins/{federated_digital_twin_id}/federated_digital_objects/{federated_digital_object_id}`
      );
   }
});

/**
 * get federated digital object data
 * localhost:1203/fedit/v1/federated-twins/{federated_digital_twin_id}/federated_digital_objects/{federated_digital_object_id}/data
 * @body {String} federated_digital_twin_id (required)
 * @body {String} federated_digital_object_id (required)
 * @body {String} timestamp (system)
 * @body {Json} location (optional)
 * @body {String} data (required)
 * @returns {Json} {}
 */
router.get("/:federated_digital_object_id/data", async function (req, res) {
   try {
      const { federated_digital_twin_id } = req;
      const { federated_digital_object_id } = req.params;
      const { from, to, count, window } = req.query;

      const result = await services.federatedDigitalObjects.getData({
         federated_digital_twin_id,
         id: federated_digital_object_id,
         from,
         to,
         count,
         window,
      });
      res.success(201, result);
   } catch (e) {
      if (!(e instanceof ErrorHandler)) {
         logger.error(e);
         e = new ErrorHandler(500, 500, "Internal Server Error of getData FDO");
      }
      e.handle(
         req,
         res,
         "GET /fedit/v1/federated_twins/{federated_digital_twin_id}/federated_digital_objects/{federated_digital_object_id}/data"
      );
   }
});

/*
 * FDO DELETE
 * localhost:1005/fedit/v1/federated-twins/{federated_digital_twin_id}/federated_digital_objects/{federated_digital_object_id}
 */
router.delete("/:federated_digital_object_id", async (req, res) => {
   try {
      const { federated_digital_twin_id } = req;
      const { federated_digital_object_id } = req.params;
      const result = await services.federatedDigitalObjects.delete({
         federated_digital_twin_id,
         id: federated_digital_object_id,
      });

      res.success(200, result);
   } catch (e) {
      if (!(e instanceof ErrorHandler)) {
         logger.error(e);
         e = new ErrorHandler(500, 500, "Internal Server Error of delete FDO");
      }
      e.handle(
         req,
         res,
         `Retrieve /fedit/v1/federated-twins/{federated_digital_twin_id}/federated_digital_objects/{federated_digital_object_id}`
      );
   }
});

/*
 * FDO UPDATE
 */
router.patch(
   "/:federated_digital_object_id",
   joi.federatedDigitalObjects.update,
   async (req, res) => {
      try {
         const { federated_digital_twin_id } = req;
         const { federated_digital_object_id } = req.params;

         const result = await services.federatedDigitalObjects.update(
            {
               federated_digital_twin_id,
               id: federated_digital_object_id,
            },
            req.body
         );

         res.success(201, result);
      } catch (e) {
         if (!(e instanceof ErrorHandler)) {
            logger.error(e);
            e = new ErrorHandler(
               500,
               500,
               "Internal Server Error of update FDO"
            );
         }
         e.handle(
            req,
            res,
            `UPDATE /fedit/v1/federated_twins/{federated_digital_twin_id}/federated_digital_objects/{federated_digital_object_id}`
         );
      }
   }
);

/**
 * FDO Control Creation (federated Digital Object control message Creation)
 */
router.post(
   "/:federated_digital_object_id/control",
   joi.federatedDigitalObjects.controlCreate,
   async function (req, res) {
      try {
         const { federated_digital_twin_id } = req;
         const { federated_digital_object_id } = req.params;

         const result = await services.federatedDigitalObjects.createControl(
            federated_digital_twin_id,
            federated_digital_object_id,
            req.body
         );

         res.success(201, result);
      } catch (e) {
         if (!(e instanceof ErrorHandler)) {
            logger.error(e);
            e = new ErrorHandler(
               500,
               500,
               "Internal Server Error of FDO Creation"
            );
         }
         e.handle(
            req,
            res,
            `POST /fedit/v1/federated_twins/{federated_digital_twin_id}/federated_digital_objects ${e}`
         );
      }
   }
);

/**
 * federated-digital-object Control Search
 * localhost:1203/fedit/v1/federated-twins/{federated_digital_twin_id}/federated_digital_objects/{federated_digital_object_id}
 * ?name=SIcrain
 * @param {string} name (required)
 * @returns {Json} {}
 */
router.get("/:federated_digital_object_id/control", async (req, res) => {
   try {
      const { federated_digital_twin_id } = req;
      const { federated_digital_object_id } = req.params;
      const { from, to } = req.query;
      const result = await services.federatedDigitalObjects.searchControl({
         federated_digital_twin_id,
         federated_digital_object_id,
         from,
         to,
      });
      res.success(200, result);
   } catch (e) {
      if (!(e instanceof ErrorHandler)) {
         logger.error(e);
         e = new ErrorHandler(500, 500, "Internal Server Error of search FDO");
      }
      e.handle(
         req,
         res,
         `Search /fedit/v1/federated-twins/{federated_digital_twin_id}/federated_digital_objects/{federated_digital_object_id}`
      );
   }
});

/**
 * federated-digital-object Control Retrive
 * localhost:1203/fedit/v1/federated-twins/{federated_digital_twin_id}/federated_digital_objects/{federated_digital_object_id}/federated_digital_object_control_data_id
 * @param {string} name (required)
 * @returns {Json} {}
 */
router.get(
   "/:federated_digital_object_id/control/:federated_digital_object_control_data_id",
   async (req, res) => {
      try {
         const { federated_digital_twin_id } = req;
         const {
            federated_digital_object_id,
            federated_digital_object_control_data_id,
         } = req.params;
         const result = await services.federatedDigitalObjects.retrieveControl({
            federated_digital_twin_id,
            federated_digital_object_id,
            federated_digital_object_control_data_id,
         });
         res.success(200, result);
      } catch (e) {
         if (!(e instanceof ErrorHandler)) {
            logger.error(e);
            e = new ErrorHandler(
               500,
               500,
               "Internal Server Error of search FDO"
            );
         }
         e.handle(
            req,
            res,
            `Search /fedit/v1/federated-twins/{federated_digital_twin_id}/federated_digital_objects/{federated_digital_object_id}`
         );
      }
   }
);

module.exports = router;
