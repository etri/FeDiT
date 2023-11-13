const express = require("express");
const asyncify = require("express-asyncify");
const router = asyncify(express.Router());
const ErrorHandler = require("../../../../../lib/error-handler");
const services = require("../../../../../services");
const auth = require("../../../../../middlewares/auth");
const joi = require("../../../../../middlewares/joi");
/**
 * service Creation

 * @body {String} service_id (system)
 * @body {String} federated_twin_id (required)
 * @body {String} service_name (required)
 * @body {String} description (required)
 * @body {String} tags (optional)
 * @body {String} creation_time (system)
 * @body {String} creator_id (required)
 * @body {String} modification_time (system)
 * @body {String} service_access_url (required)
 * @body {String} authorization (optional)
 * @body {String} service_request_param (optional)
 * @body {String} service_response_info (required)
 * @body {String} response_format_type(required)
 * @body {String} interface_type (required)
 * @body {String} error_info (optional)
 * @returns {Json} {}
 */
router.post("/", joi.services.create, async function (req, res) {
   try {
      const { federated_twin_id } = req;
      const result = await services.services.create(
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
            "Internal Server Error of create service under FDT"
         );
      }
      e.handle(
         req,
         res,
         `POST /mirrorlake/v1/federated-twins/{federated_twin_id}}/services ${e}`
      );
   }
});

/**
 * service Search
 * @query {string} name (required)
 * @returns {Json} {}
 */
router.get("/", async (req, res) => {
   try {
      const { federated_twin_id } = req;
      const { name } = req.query;
      let result;
      if (name) {
         result = await services.services.search({ federated_twin_id, name });
      } else {
         result = await services.services.getAll({ federated_twin_id });
      }
      res.success(200, result);
   } catch (e) {
      if (!(e instanceof ErrorHandler)) {
         logger.error(e);
         e = new ErrorHandler(
            500,
            500,
            "Internal Server Error of search services under FDT"
         );
      }
      e.handle(
         req,
         res,
         `Search /mirrorlake/v1/federated-twins/{federated_twin_id}/digital_twins/{digital_twin_id}/services/{service_id}`
      );
   }
});

/**
 * service Retrieve  ## 서비스 아이디는 그냥 service_id 로 정의 해도 문제가 생기지 않나?
 * @param {string} service_id (required)
 * @returns {Json} {}
 */
router.get("/:service_id", async (req, res) => {
   try {
      const { digital_twin_id } = req;
      const { service_id } = req.params;
      const result = await services.services.retrieve({
         federated_twin_id,
         service_id,
      });

      res.success(200, result);
   } catch (e) {
      if (!(e instanceof ErrorHandler)) {
         logger.error(e);
         e = new ErrorHandler(
            500,
            500,
            "Internal Server Error of retrieve services under FDT"
         );
      }
      e.handle(
         req,
         res,
         `Retrieve /mirrorlake/v1/federated-twins/{federated_twin_id}}/services/{service_id}`
      );
   }
});

/**
 * service Update
 * @body {String} name (required)
 * @body {Json} arg (required)
 * @body {String} url (required)
 * @returns {Json} {}
 */
router.patch("/:service_id", joi.services.update, async function (req, res) {
   try {
      const { federated_twin_id } = req;
      const { service_id } = req.params;

      const result = await services.services.update(
         { federated_twin_id, service_id },
         req.body
      );

      res.success(201, result);
   } catch (e) {
      if (!(e instanceof ErrorHandler)) {
         logger.error(e);
         e = new ErrorHandler(
            500,
            500,
            "Internal Server Error of update services under FDT"
         );
      }
      e.handle(
         req,
         res,
         `POST /mirrorlake/v1/federated-twins/{federated_twin_id}}/services/{service_id}/update ${e}`
      );
   }
});

/**
 * service delete
 * @param {string} service_id (required)
 * @returns {Json} {}
 */
router.delete("/:service_id", async (req, res) => {
   try {
      const { federated_twin_id } = req;
      const { service_id } = req.params;
      const result = await services.services.delete({
         federated_twin_id,
         service_id,
      });

      res.success(200, result);
   } catch (e) {
      if (!(e instanceof ErrorHandler)) {
         logger.error(e);
         e = new ErrorHandler(
            500,
            500,
            "Internal Server Error of delete services under FDT"
         );
      }
      e.handle(
         req,
         res,
         `Delete /mirrorlake/v1/federated-twins/{federated_twin_id}}/services/{service_id}/delete ${e}`
      );
   }
});

/**
 * 서비스 실행
 * @param {string} service_id (required)
 * @returns {Json} {}
 */
router.post("/:service_id/execute", async function (req, res) {
   try {
      const { digital_twin_id } = req;
      const { service_id } = req.params;
      const result = await services.services.execute({
         federated_twin_id,
         service_id,
      });

      res.success(200, result);
   } catch (e) {
      if (!(e instanceof ErrorHandler)) {
         logger.error(e);
         e = new ErrorHandler(
            500,
            500,
            "Internal Server Error of execute services under FDT"
         );
      }
      e.handle(
         req,
         res,
         `POST /mirrorlake/v1/federated-twins/{federated_twin_id}}/services/{service_id}/execute ${e}`
      );
   }
});

module.exports = router;
