const Joi = require("joi");
const { validate } = require("./base/validate.js");

exports.create = (req, res, next) => {
   const schema = Joi.object({
      digital_twin_id: Joi.string().allow(),
      service_name: Joi.string().required(),
      description: Joi.string().default(null),
      tags: Joi.array()
         .items(Joi.string().allow("").default("etc"))
         .default([]),
      creator_id: Joi.string().default("anonymous"),
      service_access_url: Joi.string().required(),
      authorization: Joi.string().default(null),
      service_request_param: Joi.string().default(null),
      service_response_info: Joi.string().default(null),
      response_format_type: Joi.string().default(null),
      interface_type: Joi.string().default(null),
      error_info: Joi.string().default(null),
      preliminary_field: Joi.object().empty({}).default(null),
   });

   validate(schema, req, res, next);
};

exports.update = (req, res, next) => {
   const schema = Joi.object({
      digital_twin_id: Joi.string().allow(),
      service_id: Joi.string().allow(),
      service_name: Joi.string().allow(),
      description: Joi.string().allow(),
      tags: Joi.array().items(Joi.string()).allow(),
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
