const express = require("express");
const asyncify = require("express-asyncify");
const router = asyncify(express.Router());
const services = require("../../../../../services");
const ErrorHandler = require("../../../../../lib/error-handler");
const { visualModelUpload } = require("../../../../../loaders/multer");
const joi = require("../../../../../middlewares/joi");

/**
 * Visual Model Creation
 *
 * @body {String} visual_model_id (system)
 * @body {String} digital_twin_id (required)
 * @body {String} visual_model_name (required)
 * @body {String} description (optional)
 * @body {String} subject (required)
 * @body {String} keywords (required)
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

/**
 * visualModel Creation
 */
router.post("/", joi.visualModelsLight.create, async function (req, res) {
  try {
    const { digital_twin_id } = req;
    const result = await services.visualModels.create(
      digital_twin_id,
      req.body,
    );

    res.success(201, result);
  } catch (e) {
    if (!(e instanceof ErrorHandler)) {
      logger.error(e);
      e = new ErrorHandler(
        500,
        500,
        "Internal Server Error of creating visualModel",
      );
    }
    e.handle(
      req,
      res,
      `POST /fedit/v1/digital-twins/{digital_twin_id}/visualModels ${e}`,
    );
  }
});

router.get("/", async (req, res) => {
  try {
    const { digital_twin_id } = req;
    const { name } = req.query;
    let result;
    if (name) {
      result = await services.visualModels.search({
        digital_twin_id,
        name,
      });
    } else {
      result = await services.visualModels.getAll({
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
      `Search /fedit/v1/digital-twins/{digital_twin_id}/visual-models?name={name}`,
    );
  }
});

router.get("/:visual_model_id", async (req, res) => {
  try {
    const { digital_twin_id } = req;
    const { visual_model_id } = req.params;
    const result = await services.visualModels.retrieve({
      digital_twin_id,
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
      `Retrieve /fedit/v1/digital-twins/{digital_twin_id}/visual-models/{visual_model_id}`,
    );
  }
});

router.get("/:visual_model_id/download", async (req, res) => {
  try {
    const { digital_twin_id } = req;
    const { visual_model_id } = req.params;
    const result = await services.visualModels.download({
      digital_twin_id,
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
      `Download /fedit/v1/digital-twins/{digital_twin_id}/visual-models/{visual_model_id}`,
    );
  }
});

router.patch("/:visual_model_id", joi.visualModels.update, async (req, res) => {
  try {
    const { digital_twin_id } = req;
    const { visual_model_id } = req.params;

    const result = await services.visualModels.update(
      { digital_twin_id, visual_model_id },
      req.body,
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
      `Update /fedit/v1/digital-twins/{digital_twin_id}/visual-models/{visual_model_id}`,
    );
  }
});

router.delete("/:visual_model_id", async (req, res) => {
  try {
    const { digital_twin_id } = req;
    const { visual_model_id } = req.params;
    const result = await services.visualModels.delete({
      digital_twin_id,
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
      `Delete /fedit/v1/digital-twins/{digital_twin_id}/visual-models/{visual_model_id}`,
    );
  }
});

module.exports = router;
