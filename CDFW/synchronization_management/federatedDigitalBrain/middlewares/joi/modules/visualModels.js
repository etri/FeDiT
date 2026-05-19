const Joi = require("joi");
const { validate } = require("./base/validate.js");

/**
 * access_url -> visual_model_access_url
 * file_format -> visual_model_format
 * file_size -> visual_model_file_size
 */
exports.create = (req, res, next) => {
   const schema = Joi.object({
      digital_twin_id: Joi.string().allow(),
      visual_model_name: Joi.string().required(),
      description: Joi.string().default(null),
      creator_id: Joi.string().default("anonymous"),
      visual_model_access_url: Joi.string().required(),
      visual_model_format: Joi.string().required(),
      visual_model_file_size: Joi.string().default(null),
      location: Joi.object({
         lat: Joi.number().min(125).max(132).required(),
         lng: Joi.number().min(33).max(39).required(),
      }),
      visual_data: Joi.string().default(null),
   });

   validate(schema, req, res, next);
};

exports.update = (req, res, next) => {
   const schema = Joi.object({
      digital_twin_id: Joi.string().allow(),
      visual_model_id: Joi.string().allow(),
      visual_model_name: Joi.string().allow(),
      description: Joi.string().allow(),
      creator_id: Joi.string().allow(),
      visual_model_access_url: Joi.string().allow(),
      visual_model_format: Joi.string().allow(),
      visual_model_file_size: Joi.string().allow(),
      location: Joi.object({
         lat: Joi.number().min(125).max(132),
         lng: Joi.number().min(33).max(39),
      }).allow(),
      visual_data: Joi.string().allow(),
   });

   validate(schema, req, res, next);
};
