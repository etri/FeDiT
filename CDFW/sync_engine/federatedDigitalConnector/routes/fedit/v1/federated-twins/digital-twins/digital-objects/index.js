const express = require("express");
const asyncify = require("express-asyncify");
const router = asyncify(express.Router());
const services = require("../../../../../../services");
const ErrorHandler = require("../../../../../../lib/error-handler");
const auth = require("../../../../../../middlewares/auth");
const joi = require("../../../../../../middlewares/joi");
/**
 * DO Creation
 */
router.post("/", joi.digitalObjects.create, async function (req, res) {
   try {
      const { federated_digital_twin_id, digital_twin_id } = req;
      const result = await services.digitalObjects.create(
         federated_digital_twin_id,
         digital_twin_id,
         req.body
      );

      res.success(201, result);
   } catch (e) {
      if (!(e instanceof ErrorHandler)) {
         logger.error(e);
         e = new ErrorHandler(
            500,
            500,
            "Internal Server Error when creating digital objects"
         );
      }
      e.handle(
         req,
         res,
         `POST /fedit/v1/federated-twins/{federated_digital_twin_id}/digital-twins/{digital_twin_id}}/digital-objects ${e}`
      );
   }
});

/**
 * digital-object Search
 * localhost:1203/fedit/v1/{digital_twin_id}/digital-objects
 * ?name=SIcrain
 * @param {string} name (required)
 * @returns {Json} {}
 */

router.get("/", async (req, res) => {
   try {
      const { federated_digital_twin_id, digital_twin_id } = req;
      const { name } = req.query;
      let result;
      if (name) {
         result = await services.digitalObjects.Search({
            federated_digital_twin_id,
            digital_twin_id,
            name,
         });
      } else {
         result = await services.digitalObjects.getAll({
            federated_digital_twin_id,
            digital_twin_id,
         });
      }
      res.success(200, result);
   } catch (e) {
      if (!(e instanceof ErrorHandler)) {
         logger.error(e);
         e = new ErrorHandler(500, 500, "Internal Server Error");
      }
      e.handle(
         req,
         res,
         `Search /fedit/v1/digital-twins/digital-objects/digital-objects`
      );
   }
});

/**
 * digital-object Retrieve
 * localhost:1203/fedit/v1/{digital_twin_id}/digital-objects
 * ?name=SIcrain
 * @param {string} digital_object_id (required)
 * @returns {Json} {}
 */
router.get("/:digital_object_id", async (req, res) => {
   try {
      const { federated_digital_twin_id, digital_twin_id } = req;
      const { digital_object_id } = req.params;
      const result = await services.digitalObjects.Retrieve({
         federated_digital_twin_id,
         digital_twin_id,
         digital_object_id,
      });

      res.success(200, result);
   } catch (e) {
      if (!(e instanceof ErrorHandler)) {
         logger.error(e);
         e = new ErrorHandler(500, 500, "Internal Server Error");
      }
      e.handle(
         req,
         res,
         `Retrieve /fedit/v1/{digital_twin_id}/digital-objects`
      );
   }
});

/**
 * DO data Creation
 */
router.post(
   "/:digital_object_id/data",
   joi.digitalObjects.dataCreate,
   async function (req, res) {
      try {
         const { federated_digital_twin_id, digital_twin_id } = req;
         const { digital_object_id } = req.params;
         const result = await services.digitalObjects.createDigitalObjectData(
            { federated_digital_twin_id, digital_twin_id, digital_object_id },
            req.body
         );

         res.success(201, result);
      } catch (e) {
         if (!(e instanceof ErrorHandler)) {
            logger.error(e);
            e = new ErrorHandler(
               500,
               500,
               "Internal Server Error when creating digital objects"
            );
         }
         e.handle(
            req,
            res,
            `POST /fedit/v1/federated-twins/{federated_digital_twin_id}/digital-twins/{digital_twin_id}}/digital-objects ${e}`
         );
      }
   }
);

/**
 * get digital object data
 * localhost:1203/fedit/v1/{digital_twin_id}/digital-objects/{digital_object_id}/data
 * @body {String} fedit_id (required)
 * @body {String} digital_twin_id (required)
 * @body {String} digital_object_id (required)
 * @body {String} timestamp (system)
 * @body {Json} location (optional)
 * @body {String} data (required)
 * @returns {Json} {}
 */
router.get("/:digital_object_id/data", async function (req, res) {
   try {
      const { federated_digital_twin_id, digital_twin_id } = req;
      const { digital_object_id } = req.params;
      const { from, to, count } = req.query;

      const result = await services.digitalObjects.getData({
         federated_digital_twin_id,
         digital_twin_id,
         id: digital_object_id,
         from,
         to,
         count,
      });
      res.success(201, result);
   } catch (e) {
      if (!(e instanceof ErrorHandler)) {
         logger.error(e);
         e = new ErrorHandler(500, 500, "Internal Server Error");
      }
      e.handle(
         req,
         res,
         "GET /fedit/v1/{digital_twin_id}/digital-objects/{digital_object_id}/data"
      );
   }
});

/*
 * DO DELETE
 * localhost:1005/fedit/v1/{digital_twin_id}/digital-objects?name=DOcrain26
 */
router.delete("/:digital_object_id", async (req, res) => {
   try {
      const { federated_digital_twin_id, digital_twin_id } = req;
      const { digital_object_id } = req.params;
      const result = await services.digitalObjects.delete({
         federated_digital_twin_id,
         digital_twin_id,
         id: digital_object_id,
      });

      res.success(200, result);
   } catch (e) {
      if (!(e instanceof ErrorHandler)) {
         logger.error(e);
         e = new ErrorHandler(500, 500, "Internal Server Error");
      }
      e.handle(
         req,
         res,
         `delete /fedit/v1/{digital_twin_id}/digital-objects/{digital_object_id}`
      );
   }
});

/*
 * DO UPDATE
 */
router.patch(
   "/:digital_object_id",
   joi.digitalObjects.update,
   async (req, res) => {
      try {
         const { federated_digital_twin_id, digital_twin_id } = req;
         const { digital_object_id } = req.params;

         const result = await services.digitalObjects.update(
            {
               federated_digital_twin_id,
               digital_twin_id,
               id: digital_object_id,
            },
            req.body
         );

         res.success(201, result);
      } catch (e) {
         if (!(e instanceof ErrorHandler)) {
            logger.error(e);
            e = new ErrorHandler(500, 500, "Internal Server Error");
         }
         e.handle(
            req,
            res,
            `UPDATE /fedit/v1/{digital_twin_id}/digital-objects/{digital_object_id}`
         );
      }
   }
);

/**
 * digital-object control data creation
 * localhost:1203/mirrorlake/v1/federated-twins/{federated_twin_id}/digital-twins/{digital_twin_id}/digital-objects/{digital_object_id}/control
 * @body {String} digital_twin_id (required)
 * @body {String} digital_object_id (required)
 * @body {String} control_data_id (system)
 * @body {Json Array} control_messages (controller_id, control_data_creator command)
 * @returns {Json} {}
 */
router.post(
   "/:digital_object_id/control",
   joi.controllers.DataCreate,
   async function (req, res) {
      try {
         const { federated_digital_twin_id, digital_twin_id } = req;
         const { digital_object_id } = req.params;
         // const { control_messages } = req.body;
         const result = await services.digitalObjects.createDOControlData(
            federated_digital_twin_id,
            digital_twin_id,
            digital_object_id,
            req.body // control_data_creator, controller_id, control_command
         );

         res.success(201, result);
      } catch (e) {
         if (!(e instanceof ErrorHandler)) {
            logger.error(e);
            e = new ErrorHandler(500, 500, "Internal Server Error");
         }
         e.handle(
            req,
            res,
            "POST /fedit/v1/federated-twins/{federated_digital_twin_id}/digital-twins/{digital_twin_id}/digital-objects/{digital_object_id}/control}"
         );
      }
   }
);

/**
 * digital-object control data creation
 * localhost:1203/fedit/v1/federated-twins/{federated_twin_id}/digital-twins/{digital_twin_id}/digital-objects/{digital_object_id}/control/{control_data_id}/control-result
 * @body {String} digital_twin_id (required)
 * @body {String} digital_object_id (required)
 * @body {String} control_data_id (system)
 * @body {Json Array} control_messages (controller_id, control_data_creator command)
 * @returns {Json} {}
 */
router.post(
   "/:digital_object_id/control/:digital_object_control_data_id/control-result",
   joi.controllers.DataResultCreate,
   async function (req, res) {
      try {
         const { federated_digital_twin_id, digital_twin_id } = req;
         const { digital_object_id, digital_object_control_data_id } =
            req.params;

         const result = await services.digitalObjects.createDOExecutionData(
            digital_twin_id,
            digital_object_id,
            digital_object_control_data_id,
            req.body // controller_id, execution result
         );

         res.success(201, result);
      } catch (e) {
         if (!(e instanceof ErrorHandler)) {
            logger.error(e);
            e = new ErrorHandler(500, 500, "Internal Server Error");
         }
         e.handle(
            req,
            res,
            "POST /fedit/v1/federated-twins/{federated_digital_twin_id}/digital-twins/{digital_twin_id}/digital-objects/{digital_object_id}/control}"
         );
      }
   }
);

/**
 * digital-object control data retrieve
 * localhost:1203/fedit/v1/federated-twins/{federated_twin_id}/digital-twins/{digital_twin_id}/digital-objects/{digital_object_id}/control?from=2023-03-12T23:32:01.232&to=2023-04-12T06:48:45.232
 * @param {string} name (required)
 * @returns {Json} {}
 */
router.get("/:digital_object_id/control", async (req, res) => {
   try {
      const { federated_digital_twin_id, digital_twin_id } = req;
      const { digital_object_id } = req.params;
      const { from, to } = req.query;

      const result = await services.digitalObjects.searchControl({
         digital_twin_id,
         digital_object_id,
         from,
         to,
      });

      res.success(200, result);
   } catch (e) {
      if (!(e instanceof ErrorHandler)) {
         logger.error(e);
         e = new ErrorHandler(500, 500, "Internal Server Error");
      }
      e.handle(
         req,
         res,
         `Retrive /fedit/v1/{digital_twin_id}/digital-objects/{digital_object_id}/control`
      );
   }
});

/**
 * digital-object control data retrieve
 * localhost:1203/fedit/v1/federated-twins/{federated_twin_id}/digital-twins/{digital_twin_id}/digital-objects/{digital_object_id}/control/{digital_object_control_data_id}
 * @param {string} name (required)
 * @returns {Json} {}
 */
router.get(
   "/:digital_object_id/control/:digital_object_control_data_id",
   async (req, res) => {
      try {
         const { federated_digital_twin_id, digital_twin_id } = req;
         const { digital_object_id, digital_object_control_data_id } =
            req.params;

         const result = await services.digitalObjects.retrieveControl({
            digital_twin_id,
            digital_object_id,
            digital_object_control_data_id,
         });

         res.success(200, result);
      } catch (e) {
         if (!(e instanceof ErrorHandler)) {
            logger.error(e);
            e = new ErrorHandler(500, 500, "Internal Server Error");
         }
         e.handle(
            req,
            res,
            `Retrive /fedit/v1/{digital_twin_id}/digital-objects/{digital_object_id}/control`
         );
      }
   }
);

module.exports = router;
