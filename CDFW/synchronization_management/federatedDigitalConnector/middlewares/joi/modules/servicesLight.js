const Joi = require("joi");
const { validate } = require("./base/validate.js");

exports.create = (req, res, next) => {
   const schema = Joi.object({
      service_identifier: Joi.string().empty("").default(null),
      digital_twin_id: Joi.string().allow(),
      service_name: Joi.string().required(),
      description: Joi.string().allow("").default(null),
      keywords: Joi.array()
         .items(Joi.string().allow("").default("etc"))
         .default([]),
      subjects: Joi.array()
         .items(Joi.string().allow("").default("etc"))
         .default([]),
      creation_time: Joi.string().allow("").default(null),
      modification_time: Joi.string().allow("").default(null),
      service_access_url: Joi.string().allow("").default(null),
      authorization: Joi.string().allow("").default(null),
      service_request_param: Joi.object().default(null),
      service_response_info: Joi.object().default(null),
      response_format_type: Joi.string().allow("").default(null),
      interface_type: Joi.string().allow("").default(null),
      error_info: Joi.object().default(null),
      preliminary_field: Joi.object().default(null),
   });

   validate(schema, req, res, next);
};

exports.update = (req, res, next) => {
   const schema = Joi.object({
      digital_twin_id: Joi.string().allow(),
      service_id: Joi.string().allow(),
      service_name: Joi.string().allow(),
      description: Joi.string().allow(),
      keywords: Joi.array().items(Joi.string()).allow(),
      subjects: Joi.array().items(Joi.string()).allow(),
      creation_time: Joi.string().allow(),
      modification_time: Joi.string().allow(),
      service_access_url: Joi.string().allow(),
      authorization: Joi.string().allow(),
      service_request_param: Joi.object().allow(),
      service_response_info: Joi.object().allow(),
      response_format_type: Joi.string().allow(),
      interface_type: Joi.string().allow(),
      error_info: Joi.object().allow(),
      preliminary_field: Joi.object().allow(),
   });

   validate(schema, req, res, next);
};
