const express = require("express");
const asyncify = require("express-asyncify");
const router = asyncify(express.Router());
const services = require("../../../../../services");
const ErrorHandler = require("../../../../../lib/error-handler");
const auth = require("../../../../../middlewares/auth");
const joi = require("../../../../../middlewares/joi");

/**
 * subscription Creation
 * @body {String} subscription_id (system)
 * @body {Json} federated_digital_twin_id (system)
 * @body {Json} subscription_name (required)
 * @body {String} description (optional)
 * @body {String} create_time (system)
 * @body {String} creator_id (required)
 * @body {String} modification_time (system)
 * @body {String array} subscription_subject (required)
 * @body {enum} subscription_protocol (required)
 * @body {String} notification_url (required)
 * @body {String} expiration_time (system)
 * @body {Integer} expiration_count (system)
 * @body {Integer} fail_count (system)
 * @returns {Json} {}
 */
router.post("/", joi.subscriptions.create, async function (req, res) {
   try {
      const { federated_digital_twin_id } = req;
      const result = await services.subscriptions.create(
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
            "Internal Server Error of creating subscription"
         );
      }
      e.handle(
         req,
         res,
         `POST /fedit/v1/federated_twins/{federated_digital_twin_id}/subscriptions ${e}`
      );
   }
});

/**
 * subscription Search
 * @query {string} name (required)
 * @returns {Json} {}
 */
router.get("/", async (req, res) => {
   try {
      const { federated_digital_twin_id } = req;
      const { name } = req.query;
      let result;
      if (name) {
         result = await services.subscriptions.search({
            federated_digital_twin_id,
            name,
         });
      } else {
         result = await services.subscriptions.getAll({
            federated_digital_twin_id,
         });
      }
      res.success(200, result);
   } catch (e) {
      if (!(e instanceof ErrorHandler)) {
         logger.error(e);
         e = new ErrorHandler(
            500,
            500,
            "Internal Server Error of search function in subscriptions"
         );
      }
      e.handle(
         req,
         res,
         `Search /fedit/v1/federated-twins/{federated_digital_twin_id}/subscriptions/{subscription_id}`
      );
   }
});

/**
 * subscription Retrieve
 * @param {string} subscription_id (required)
 * @returns {Json} {}
 */
router.get("/:subscription_id", async (req, res) => {
   try {
      const { federated_digital_twin_id } = req;
      const { subscription_id } = req.params;
      const result = await services.subscriptions.retrieve({
         federated_digital_twin_id,
         subscription_id,
      });

      res.success(200, result);
   } catch (e) {
      if (!(e instanceof ErrorHandler)) {
         logger.error(e);
         e = new ErrorHandler(
            500,
            500,
            "Internal Server Error of retrieve function in subscriptions"
         );
      }
      e.handle(
         req,
         res,
         `Retrieve /fedit/v1/federated-twins/{federated_digital_twin_id}/subscriptions/{subscription_id} ${e}`
      );
   }
});

/**
 * subscription Update
 * @param {String} subscription_id (required)
 * @returns {Json} {}
 */
router.patch(
   "/:subscription_id",
   joi.subscriptions.update,
   async function (req, res) {
      try {
         const { federated_digital_twin_id } = req;
         const { subscription_id } = req.params;
         const result = await services.subscriptions.update(
            { federated_digital_twin_id, subscription_id },
            req.body
         );

         res.success(201, result);
      } catch (e) {
         if (!(e instanceof ErrorHandler)) {
            logger.error(e);
            e = new ErrorHandler(
               500,
               500,
               "Internal Server Error of subscription update"
            );
         }
         e.handle(
            req,
            res,
            `POST /fedit/v1/federated-twins/{federated_digital_twin_id}/subscriptions/{subscription_id} ${e}`
         );
      }
   }
);

/**
 * subscription delete
 * @param {string} subscription_id (required)
 * @returns {Json} {}
 */
router.delete("/:subscription_id", async (req, res) => {
   try {
      const { federated_digital_twin_id } = req;
      const { subscription_id } = req.params;
      const result = await services.subscriptions.delete({
         federated_digital_twin_id,
         subscription_id,
      });

      res.success(200, result);
   } catch (e) {
      if (!(e instanceof ErrorHandler)) {
         logger.error(e);
         e = new ErrorHandler(
            500,
            500,
            "Internal Server Error of subscription delete"
         );
      }
      e.handle(
         req,
         res,
         `Delete /fedit/v1/federated-twins/{federated_digital_twin_id}/subscriptions/{subscription_id} ${e}`
      );
   }
});

module.exports = router;
