const Joi = require("joi");
const { validate } = require("./base/validate.js");

exports.create = (req, res, next) => {
   const schema = Joi.object({
      mirrorlake_id: Joi.string().required(),
      federated_digital_twin_name: Joi.string().required(),
      description: Joi.string().default(null),
      owner: Joi.string().default("anonymous"),
      tags: Joi.array()
         .items(Joi.string().allow("").default("etc"))
         .default([]),
      point_of_access: Joi.string().default(null),
      creator_id: Joi.string().default("anonymous"),
      location: Joi.object().empty({}).default(null),
   });
   validate(schema, req, res, next);
};

exports.update = (req, res, next) => {
   const schema = Joi.object({
      mirrorlake_id: Joi.string().allow(),
      federated_digital_twin_name: Joi.string().allow(),
      description: Joi.string().allow(),
      owner: Joi.string().allow(),
      tags: Joi.array().items(Joi.string()).allow(),
      point_of_access: Joi.string().allow(),
      creator_id: Joi.string().allow(),
      location: Joi.object().allow(),
   });

   validate(schema, req, res, next);
};
