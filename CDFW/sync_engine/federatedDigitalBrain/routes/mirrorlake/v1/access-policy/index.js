const express = require("express");
const asyncify = require("express-asyncify");
const router = asyncify(express.Router());

const services = require("../../../../services");
const ErrorHandler = require("../../../../lib/error-handler");
/**
 * access-policy Creation
 * @body {String} digital_twin_id (required)
 * @body {String} creator_id (required)
 * @body {String} read_passcode (optional)
 * @body {String} write_passcode (required)
 * @returns {Json} {}
 */
router.post("/", async function (req, res) {
   try {
      const result = await services.accessPolicy.create(req.body);

      res.success(201, result);
   } catch (e) {
      if (!(e instanceof ErrorHandler)) {
         logger.error(e);
         e = new ErrorHandler(500, 500, "Internal Server Error at access policy post request");
      }
      e.handle(req, res, "POST /mirrorlake/v1/access-policy");
   }
});

/**
 * access-policy Retrieve
 * localhost:1203/mirrorlake/v1/access-policy/{access_policy_id}
 * ?name=SIcrain
 * @param {string} access_policy_id (required)
 * @returns {Json} {}
 */
router.get("/:access_policy_id", async (req, res) => {
   try {
      const { access_policy_id } = req.params;
      const result = await services.accessPolicy.Retrieve({
         access_policy_id,
      });

      res.success(200, result);
   } catch (e) {
      if (!(e instanceof ErrorHandler)) {
         logger.error(e);
         e = new ErrorHandler(500, 500, "Internal Server Error at access policy retrieve get request");
      }
      e.handle(
         req,
         res,
         `Retrieve /mirrorlake/v1/{digital_twin_id}/access-policy/{access_policy_id}`
      );
   }
});

/**
 * access-policy Retrieve(ALL)
 * localhost:1203/mirrorlake/v1/access-policy/all/data
 * ?name=SIcrain
 * @param {string} access_policy_id (required)
 * @returns {Json} {}
 */
router.get("/data/all", async (req, res) => {
   try {
      const result = await services.accessPolicy.RetrieveEntire();

      res.success(200, result);
   } catch (e) {
      if (!(e instanceof ErrorHandler)) {
         logger.error(e);
         e = new ErrorHandler(500, 500, "Internal Server Error at access policy retrieve all get request");
      }
      e.handle(
         req,
         res,
         `Retrieve /mirrorlake/v1/{digital_twin_id}/access-policy/{access_policy_id}`
      );
   }
});

/*
 * access-policy UPDATE
 * localhost:1203/mirrorlake/v1/{digital_twin_id}/access-policy/{access_policy_id}/{access_policy_id}
 */
router.put("/:access_policy_id", async (req, res) => {
   try {
      const { access_policy_id } = req.params;
      const { body } = req.body;

      const result = await services.accessPolicy.update(access_policy_id, {
         body,
      });

      res.success(201, result);
   } catch (e) {
      if (!(e instanceof ErrorHandler)) {
         logger.error(e);
         e = new ErrorHandler(500, 500, "Internal Server Error ay access policy update request");
      }
      e.handle(
         req,
         res,
         "UPDATE /mirrorlake/v1/{digital_twin_id}/access-policy/{access_policy_id}"
      );
   }
});

/*
 * access-policy DELETE
 * localhost:1203/mirrorlake/v1/{digital_twin_id}/access-policy/{access_policy_id}
 */
router.delete("/:access_policy_id", async (req, res) => {
   try {
      const { access_policy_id } = req.params;
      const result = await services.accessPolicy.delete({ access_policy_id });

      res.success(200, result);
   } catch (e) {
      if (!(e instanceof ErrorHandler)) {
         logger.error(e);
         e = new ErrorHandler(500, 500, "Internal Server Error at access policy delete request");
      }
      e.handle(
         req,
         res,
         `Retrieve /mirrorlake/v1/{digital_twin_id}/access-policy`
      );
   }
});

//////////////////////////////////////////////////////////
/*
 * access-policy Entire Retrieve
 *
router.get("/all", async function (req, res) {
   try {
      const result = await services.accessPolicy.getAll();

      res.success(200, result);
   } catch (e) {
      if (!(e instanceof ErrorHandler)) {
         logger.error(e);
         e = new ErrorHandler(500, 500, "Internal Server Error");
      }
      e.handle(
         req,
         res,
         `Retrieve /mirrorlake/v1/{digital_twin_id}/access-policy/all`
      );
   }
});

/*
 * access-policy Entire Delete
 *
router.delete("/all", async function (req, res) {
   try {
      const result = await services.accessPolicy.deleteAll();

      res.success(200, result);
   } catch (e) {
      if (!(e instanceof ErrorHandler)) {
         logger.error(e);
         e = new ErrorHandler(500, 500, "Internal Server Error");
      }
      e.handle(
         req,
         res,
         `Retrieve /mirrorlake/v1/{digital_twin_id}/access-policy/all`
      );
   }
});

/**
 * access-policy Search
 * localhost:1203/mirrorlake/v1/{digital_twin_id}/access-policy
 * ?name=SIcrain
 * @param {string} name (required)
 * @returns {Json} {}
 
 router.get("/", async (req, res) => {
   try {
      const { name } = req.query;

      const result = await services.accessPolicy.Search({ name });

      res.success(200, result);
   } catch (e) {
      if (!(e instanceof ErrorHandler)) {
         logger.error(e);
         e = new ErrorHandler(500, 500, "Internal Server Error");
      }
      e.handle(
         req,
         res,
         `Search /mirrorlake/v1/digital-twins/access-policy/access-policy`
      );
   }
});
*/

module.exports = router;
