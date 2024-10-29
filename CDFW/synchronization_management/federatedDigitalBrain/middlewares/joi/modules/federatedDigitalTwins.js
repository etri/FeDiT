const Joi = require("joi");
const { validate } = require("./base/validate.js");

exports.create = (req, res, next) => {
   const schema = Joi.object({
      federated_digital_twin_identifier: Joi.string().empty("").default(null),
      federated_digital_twin_name: Joi.string().required(),
      description: Joi.string().empty("").default(null),
      owner: Joi.string().default("anonymous"),
      keywords: Joi.array()
         .items(Joi.string().allow("").default("etc"))
         .default([]),
      point_of_access: Joi.string().empty("").default(null),
      creator_id: Joi.string().default("anonymous"),
      location: Joi.object().empty({}).default(null),
   });
   validate(schema, req, res, next);
};

exports.update = (req, res, next) => {
   const schema = Joi.object({
      federated_digital_twin_name: Joi.string().allow(),
      description: Joi.string().allow(),
      owner: Joi.string().allow(),
      keywords: Joi.array().items(Joi.string()).allow(),
      point_of_access: Joi.string().allow(),
      creator_id: Joi.string().allow(),
      location: Joi.object().allow(),
   });

   validate(schema, req, res, next);
};
