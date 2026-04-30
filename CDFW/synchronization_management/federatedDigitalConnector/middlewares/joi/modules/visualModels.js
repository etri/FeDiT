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
    creation_time: Joi.string().required(),
    modification_time: Joi.string().required(),
    keywords: Joi.array()
      .items(Joi.string().allow("").default("etc"))
      .default([]),
    subjects: Joi.array()
      .items(Joi.string().allow("").default("etc"))
      .default([]),
    visual_model_access_url: Joi.string().required(),
    visual_model_format: Joi.string().required(),
    visual_model_file_size: Joi.string().default(null),
    level_of_details: Joi.number().default(0),
  });

  validate(schema, req, res, next);
};

exports.update = (req, res, next) => {
  const schema = Joi.object({
    digital_twin_id: Joi.string().allow(),
    visual_model_id: Joi.string().allow(),
    visual_model_name: Joi.string().allow(),
    description: Joi.string().allow(),
    keywords: Joi.array().items(Joi.string()).allow(),
    creation_time: Joi.string().allow(),
    modification_time: Joi.string().allow(),
    subjects: Joi.array().items(Joi.string()).allow(),
    visual_model_access_url: Joi.string().allow(),
    visual_model_format: Joi.string().allow(),
    visual_model_file_size: Joi.string().allow(),
    level_of_details: Joi.number().allow(),
  });

  validate(schema, req, res, next);
};
