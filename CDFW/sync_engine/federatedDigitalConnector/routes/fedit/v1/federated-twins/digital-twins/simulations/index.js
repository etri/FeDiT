const express = require("express");
const asyncify = require("express-asyncify");
const router = asyncify(express.Router());
const services = require("../../../../../../services");
const ErrorHandler = require("../../../../../../lib/error-handler");
const joi = require("../../../../../../middlewares/joi");
/**
 * simulation Creation
 */
router.post("/", joi.simulations.create, async function (req, res) {
   try {
      const { federated_digital_twin_id, digital_twin_id } = req;
      const result = await services.simulations.create(
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
            "Internal Server Error of creating simulation"
         );
      }
      e.handle(
         req,
         res,
         `POST /fedit/v1/federated-twins/{federated_digital_twin_id}}/digital-twins/{digital_twin_id}/simulations ${e}`
      );
   }
});

/**
 * simulation Search
 * @query {string} name (required)
 * @returns {Json} {}
 */
router.get("/", async (req, res) => {
   try {
      const { federated_digital_twin_id, digital_twin_id } = req;
      const { name } = req.query;
      let result;
      if (name) {
         result = await services.simulations.search({
            federated_digital_twin_id,
            digital_twin_id,
            name,
         });
      } else {
         result = await services.simulations.getAll({
            federated_digital_twin_id,
            digital_twin_id,
         });
      }
      res.success(200, result);
   } catch (e) {
      if (!(e instanceof ErrorHandler)) {
         logger.error(e);
         e = new ErrorHandler(
            500,
            500,
            "Internal Server Error of searching simulation"
         );
      }
      e.handle(
         req,
         res,
         `Search /fedit/v1/federated-twins/{federated_digital_twin_id}}/digital-twins/{digital_twin_id}/simulations/{simulation_id}`
      );
   }
});

/**
 * simulation Retrieve
 * @param {string} simulation_id (required)
 * @returns {Json} {}
 */
router.get("/:simulation_id", async (req, res) => {
   try {
      const { federated_digital_twin_id, digital_twin_id } = req;
      const { simulation_id } = req.params;
      const result = await services.simulations.retrieve({
         federated_digital_twin_id,
         digital_twin_id,
         simulation_id,
      });

      res.success(200, result);
   } catch (e) {
      if (!(e instanceof ErrorHandler)) {
         logger.error(e);
         e = new ErrorHandler(
            500,
            500,
            "Internal Server Error of simulation retrieving"
         );
      }
      e.handle(
         req,
         res,
         `Retrieve /fedit/v1/federated-twins/{federated_digital_twin_id}}/digital-twins/{digital_twin_id}/simulation/{simulation_id}`
      );
   }
});

/**
 * simulation Update
 * @body {String} name (required)
 * @body {Json} arg (required)
 * @body {String} url (required)
 * @returns {Json} {}
 */
router.patch(
   "/:simulation_id",
   joi.simulations.update,
   async function (req, res) {
      try {
         const { federated_digital_twin_id, digital_twin_id } = req;
         const { simulation_id } = req.params;

         const result = await services.simulations.update(
            { federated_digital_twin_id, digital_twin_id, simulation_id },
            req.body
         );

         res.success(201, result);
      } catch (e) {
         if (!(e instanceof ErrorHandler)) {
            logger.error(e);
            e = new ErrorHandler(
               500,
               500,
               "Internal Server Error of updating simulation"
            );
         }
         e.handle(
            req,
            res,
            `POST /fedit/v1/federated-twins/{federated_digital_twin_id}/digital-twins/{digital_twin_id}/simulations/{simulation_id} ${e}`
         );
      }
   }
);

/**
 * simulation delete
 * @param {string} simulation_id (required)
 * @returns {Json} {}
 */
router.delete("/:simulation_id", async (req, res) => {
   try {
      const { federated_digital_twin_id, digital_twin_id } = req;
      const { simulation_id } = req.params;
      const result = await services.simulations.delete({
         federated_digital_twin_id,
         digital_twin_id,
         simulation_id,
      });

      res.success(200, result);
   } catch (e) {
      if (!(e instanceof ErrorHandler)) {
         logger.error(e);
         e = new ErrorHandler(
            500,
            500,
            "Internal Server Error of deleting simulation in FDT"
         );
      }
      e.handle(
         req,
         res,
         `Delete /fedit/v1/federated-twins/{federated_digital_twin_id}}/digital-twins/{digital_twin_id}/simulations/{simulation_id} ${e}`
      );
   }
});

module.exports = router;
