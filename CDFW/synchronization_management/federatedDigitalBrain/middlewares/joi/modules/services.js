const Joi = require("joi");
const { validate } = require("./base/validate.js");

exports.create = (req, res, next) => {
   const schema = Joi.object({
      federated_digital_twin_id: Joi.string().allow(),
      service_name: Joi.string().required(),
      description: Joi.string().default(null),
      keywords: Joi.array()
         .items(Joi.string().allow("").default("etc"))
         .default([]),
      creator_id: Joi.string().default("anonymous"),
      service_access_url: Joi.string().empty("").required(),
      authorization: Joi.string().empty("").default(null),
      service_request_param: Joi.string().empty("").default(null),
      service_response_info: Joi.string().empty("").default(null),
      response_format_type: Joi.string().empty("").default(null),
      interface_type: Joi.string().empty("").default(null),
      error_info: Joi.string().empty("").default(null),
      preliminary_field: Joi.object().empty({}).default(null),
   });

   validate(schema, req, res, next);
};

exports.update = (req, res, next) => {
   const schema = Joi.object({
      federated_digital_twin_id: Joi.string().allow(),
      service_id: Joi.string().allow(),
      service_name: Joi.string().allow(),
      description: Joi.string().allow(),
      keywords: Joi.array().items(Joi.string()).allow(),
      creator_id: Joi.string().allow(),
      service_access_url: Joi.string().allow(),
      authorization: Joi.string().allow(),
      service_request_param: Joi.string().allow(),
      service_response_info: Joi.string().allow(),
      response_format_type: Joi.string().allow(),
      interface_type: Joi.string().allow(),
      error_info: Joi.string().allow(),
      preliminary_field: Joi.object().allow(),
   });

   validate(schema, req, res, next);
};
