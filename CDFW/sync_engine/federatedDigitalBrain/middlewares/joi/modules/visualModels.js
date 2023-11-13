const Joi = require("joi");
const { validate } = require("./base/validate.js");

exports.create = (req, res, next) => {
   const schema = Joi.object({
      digital_twin_id: Joi.string().allow(),
      visual_model_name: Joi.string().required(),
      description: Joi.string().default(null),
      creator_id: Joi.string().default("anonymous"),
      access_url: Joi.string().required(),
      file_format: Joi.string().required(),
      file_size: Joi.string().default(null),
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
      access_url: Joi.string().allow(),
      file_format: Joi.string().allow(),
      file_size: Joi.string().allow(),
      location: Joi.object({
         lat: Joi.number().min(125).max(132),
         lng: Joi.number().min(33).max(39),
      }).allow(),
      visual_data: Joi.string().allow(),
   });

   validate(schema, req, res, next);
};
