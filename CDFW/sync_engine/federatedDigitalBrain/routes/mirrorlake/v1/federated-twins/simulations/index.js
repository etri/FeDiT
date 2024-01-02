const express = require("express");
const asyncify = require("express-asyncify");
const router = asyncify(express.Router());
const services = require("../../../../../services");
const ErrorHandler = require("../../../../../lib/error-handler");
const auth = require("../../../../../middlewares/auth");
const joi = require("../../../../../middlewares/joi");

// 네이밍 과정에서 simulation은 그냥 표현되어도 되나? FDT만을 위한 새로운 시뮬레이션이 있는지?
//아니면 기존 DT의 시뮬레이션을 상속받아 사용하는지??
/**
 * simulation Creation
 */
router.post("/", joi.simulations.create, async function (req, res) {
   try {
      const { federated_digital_twin_id } = req;
      const result = await services.simulations.create(
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
            "Internal Server Error of creating simulation"
         );
      }
      e.handle(
         req,
         res,
         `POST /mirrorlake/v1/federated-twins/{federated_digital_twin_id}}/simulations ${e}`
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
      const { federated_digital_twin_id } = req;
      const { name } = req.query;
      let result;
      if (name) {
         result = await services.simulations.search({
            federated_digital_twin_id,
            name,
         });
      } else {
         result = await services.simulations.getAll({
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
            "Internal Server Error of searching simulation"
         );
      }
      e.handle(
         req,
         res,
         `Search /mirrorlake/v1/federated-twins/{federated_digital_twin_id}}/simulations/{simulation_id}`
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
      const { federated_digital_twin_id } = req;
      const { simulation_id } = req.params;
      const result = await services.simulations.retrieve({
         federated_digital_twin_id,
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
         `Retrieve /mirrorlake/v1/federated-twins/{federated_digital_twin_id}}/simulation/{simulation_id}`
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
         const { federated_digital_twin_id } = req;
         const { simulation_id } = req.params;

         const result = await services.simulations.update(
            { federated_digital_twin_id, simulation_id },
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
            `POST /mirrorlake/v1/federated-twins/{federated_digital_twin_id}/simulations/{simulation_id} ${e}`
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
      const { federated_digital_twin_id } = req;
      const { simulation_id } = req.params;
      const result = await services.simulations.delete({
         federated_digital_twin_id,
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
         `Delete /mirrorlake/v1/federated-twins/{federated_digital_twin_id}}/simulations/{simulation_id} ${e}`
      );
   }
});

/**
 * 시뮬레이션 데이터 피딩 시작 (실시간)
 * @param {string} simulation_id (required)
 * @returns {Json} {}
 */
router.post("/:simulation_id/execute", async function (req, res) {
   try {
      const { federated_digital_twin_id } = req;
      const { simulation_id } = req.params;
      const result = await services.simulations.execute({
         federated_digital_twin_id,
         simulation_id,
      });

      res.success(200, result);
   } catch (e) {
      if (!(e instanceof ErrorHandler)) {
         logger.error(e);
         e = new ErrorHandler(
            500,
            500,
            "Internal Server Error of executing simulation in FDT"
         );
      }
      e.handle(
         req,
         res,
         `POST /mirrorlake/v1/federated-twins/{federated_digital_twin_id}/simulations/{simulation_id} ${e}`
      );
   }
});

/**
 * 시뮬레이션 데이터 피딩 일시중지
 * @param {string} simulation_id (required)
 * @returns {Json} {}
 */
router.post("/:simulation_id/termination", async function (req, res) {
   try {
      const { federated_digital_twin_id } = req;
      const { simulation_id } = req.params;
      const result = await services.simulations.termination({
         federated_digital_twin_id,
         simulation_id,
      });
      res.success(200, result);
   } catch (e) {
      if (!(e instanceof ErrorHandler)) {
         logger.error(e);
         e = new ErrorHandler(
            500,
            500,
            "Internal Server Error of terminating simulation in FDT"
         );
      }
      e.handle(
         req,
         res,
         `POST /mirrorlake/v1/federated-twins/{federated_digital_twin_id}/simulations/{simulation_id} ${e}`
      );
   }
});

/**
 * 시뮬레이션 데이터 피딩 재시작
 * @param {string} simulation_id (required)
 * @returns {Json} {}
 */
router.post("/:simulation_id/resume", async function (req, res) {
   try {
      const { federated_digital_twin_id } = req;
      const { simulation_id } = req.params;
      const result = await services.simulations.resume({
         federated_digital_twin_id,
         simulation_id,
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
         `POST /mirrorlake/v1/federated-twins/{federated_digital_twin_id}/simulations/{simulation_id} ${e}`
      );
   }
});
/**
 * 시뮬레이션 데이터 생성(단발성 시뮬레이션 실행)
 * @param {string} simulation_id (required)
 * @body {string} simulation_data_id (system)
 * @body {string} simulation_id (system)
 * @body {string} timestamp (system)
 * @body {JSON} input_data (required)
 * @body {JSON} result_data (required)
 * @returns {Json} {}
 */
router.post("/:simulation_id/data", async function (req, res) {
   try {
      const { federated_digital_twin_id } = req;
      const { simulation_id } = req.params;
      const result = await services.simulations.dataCreate(
         {
            federated_digital_twin_id,
            simulation_id,
         },
         req.body
      );
      res.success(200, result);
   } catch (e) {
      if (!(e instanceof ErrorHandler)) {
         logger.error(e);
         e = new ErrorHandler(
            500,
            500,
            "Internal Server Error of creating simulation data"
         );
      }
      e.handle(
         req,
         res,
         `POST /mirrorlake/v1/federated-twins/{federated_digital_twin_id}/simulations/{simulation_id}/data ${e}`
      );
   }
});

/**
 * 시뮬레이션 데이터 조회
 * @param {string} simulation_id (required)
 * @returns {Json} {}
 */
router.get("/:simulation_id/data", async function (req, res) {
   try {
      const { federated_digital_twin_id } = req;
      const { simulation_id } = req.params;
      const { from, to, count } = req.query;
      const result = await services.simulations.dataRetrieve({
         federated_digital_twin_id,
         simulation_id,
         from,
         to,
         count,
      });
      res.success(200, result);
   } catch (e) {
      if (!(e instanceof ErrorHandler)) {
         logger.error(e);
         e = new ErrorHandler(
            500,
            500,
            "Internal Server Error of retrieving simulation data"
         );
      }
      e.handle(
         req,
         res,
         `POST /mirrorlake/v1/federated-twins/{federated_digital_twin_id}/simulations/{simulation_id} ${e}`
      );
   }
});

/**
 * 시뮬레이션 결과 저장(지연성 시뮬레이션 실행결과 저장)
 * @param {string} simulation_id (required)
 * @param {string} simulation_data_id (system)
 * @returns {Json} {}
 */
router.post(
   "/:simulation_id/data/:simulation_data_id/result",
   async function (req, res) {
      try {
         const { federated_digital_twin_id } = req;
         const { simulation_id, simulation_data_id } = req.params;
         const result_data = req.body;
         const result = await services.simulations.resultAsyncUpdate({
            federated_digital_twin_id,
            simulation_id,
            simulation_data_id,
            result_data,
         });
         res.success(200, result);
      } catch (e) {
         if (!(e instanceof ErrorHandler)) {
            logger.error(e);
            e = new ErrorHandler(500, 500, "Internal Server Error");
         }
         e.handle(req, res, `POST /DigitalTwin/simulations/data`);
      }
   }
);

module.exports = router;
