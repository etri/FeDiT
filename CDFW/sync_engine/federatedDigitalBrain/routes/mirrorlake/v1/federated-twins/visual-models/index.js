const express = require("express");
const asyncify = require("express-asyncify");
const router = asyncify(express.Router());
const services = require("../../../../../services");
const ErrorHandler = require("../../../../../lib/error-handler");
const { visualModelUpload } = require("../../../../../loaders/multer");
const auth = require("../../../../../middlewares/auth");
const joi = require("../../../../../middlewares/joi");

/**
 * Visual Model Creation
 *
 * @body {String} visual_model_id (system)
 * @body {String} federated_twin_id (required)
 * @body {String} visual_model_name (required)
 * @body {String} description (optional)
 * @body {String} subject (required)
 * @body {String} tags (required)
 * @body {String} creation_time (system)
 * @body {String} creator_id (required)
 * @body {String} modification_time (system)
 * @body {String} access_url (system)
 * @body {String} visual_datafile_format (system)
 * @body {String} visual_datafile_size (system)
 * @body {String} visual_datafile_path (system)
 * @body {String} visual_data (required)

 * @returns {Json} {}
 */

router.post("/", async function (req, res) {
   try {
      const { federated_twin_id } = req;
      visualModelUpload(req, res, async (err) => {
         try {
            const result = await services.visualModel.create(
               federated_twin_id,
               req
            );
            res.success(201, result);
         } catch (e) {
            if (!(e instanceof ErrorHandler)) {
               logger.error(e);
               e = new ErrorHandler(400, 400, "visual model create error");
            }
            e.handle(
               req,
               res,
               `Post /mirrorlake/v1/federated-twins/{federated_twin_id}/visual-models`
            );
         }

         if (err) {
            console.log("Fail visual model upload");
         }
      });
   } catch (e) {
      if (!(e instanceof ErrorHandler)) {
         logger.error(e);
         e = new ErrorHandler(500, 500, "Internal Server Error");
      }
      e.handle(
         req,
         res,
         `Post /mirrorlake/v1/federated-twins/{federated_twin_id}/visual-models`
      );
   }
});

router.get("/", async (req, res) => {
   try {
      const { federated_twin_id } = req;
      const { name } = req.query;
      let result;
      if (name) {
         result = await services.visualModel.search({
            federated_twin_id,
            name,
         });
      } else {
         result = await services.visualModel.getAll({ federated_twin_id });
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
         `Search /mirrorlake/v1/federated-twins/{federated_twin_id}/visual-models?name={name}`
      );
   }
});

router.get("/:visual_model_id", async (req, res) => {
   try {
      const { federated_twin_id } = req;
      const { visual_model_id } = req.params;
      const result = await services.visualModel.retrieve({
         federated_twin_id,
         visual_model_id,
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
         `Retrieve /mirrorlake/v1/federated-twins/{federated_twin_id}/visual-models/{visual_model_id}`
      );
   }
});

router.get("/:visual_model_id/download", async (req, res) => {
   try {
      const { federated_twin_id } = req;
      const { visual_model_id } = req.params;
      const result = await services.visualModel.download({
         federated_twin_id,
         visual_model_id,
      });
      res.download(result);
      // res.success(200, result);
   } catch (e) {
      if (!(e instanceof ErrorHandler)) {
         logger.error(e);
         e = new ErrorHandler(500, 500, "Internal Server Error");
      }
      e.handle(
         req,
         res,
         `Download /mirrorlake/v1/federated-twins/{federated_twin_id}/visual-models/{visual_model_id}`
      );
   }
});

router.patch("/:visual_model_id", async (req, res) => {
   try {
      const { federated_twin_id } = req;
      const { visual_model_id } = req.params;

      const result = await services.visualModel.update(
         { federated_twin_id, visual_model_id },
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
         `Update /mirrorlake/v1/federated-twins/{federated_twin_id}/visual-models/{visual_model_id}`
      );
   }
});

router.delete("/:visual_model_id", async (req, res) => {
   try {
      const { federated_twin_id } = req;
      const { visual_model_id } = req.params;
      const result = await services.visualModel.delete({
         federated_twin_id,
         visual_model_id,
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
         `Delete /mirrorlake/v1/federated-twins/{federated_twin_id}/visual-models/{visual_model_id}`
      );
   }
});

module.exports = router;
