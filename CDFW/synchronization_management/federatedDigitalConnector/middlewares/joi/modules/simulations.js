const Joi = require("joi");
const { validate } = require("./base/validate.js");

exports.create = (req, res, next) => {
   const schema = Joi.object({
      simulation_identifier: Joi.string().empty("").default(null),
      digital_twin_id: Joi.string().allow(),
      simulation_name: Joi.string().required(),
      description: Joi.string().required(),
      keywords: Joi.array()
         .items(Joi.string().allow("").default("etc"))
         .default([]),
      subjects: Joi.array()
         .items(Joi.string().allow("").default("etc"))
         .default([]),
      creation_time: Joi.string().required(),
      modification_time: Joi.string().required(),
      simulation_access_url: Joi.string().required(),
      authorization: Joi.string().required(),
      simulation_request_param: Joi.object().required(),
      simulation_response_info: Joi.object().required(),
      response_format_type: Joi.string().valid("json", "xml").required(),
      interface_type: Joi.string().required(),
      error_info: Joi.object().required(),
      preliminary_field: Joi.object().empty({}).default(null),
   });
   validate(schema, req, res, next);
};

exports.update = (req, res, next) => {
   const schema = Joi.object({
      digital_twin_id: Joi.string().allow(),
      simulation_id: Joi.string().allow(),
      simulation_name: Joi.string().allow(),
      description: Joi.string().allow(),
      keywords: Joi.array().items(Joi.string()).allow(),
      creation_time: Joi.string().allow(),
      modification_time: Joi.string().allow(),
      subjects: Joi.array().items(Joi.string()).allow(),
      simulation_access_url: Joi.string().allow(),
      authorization: Joi.string().allow(),
      simulation_request_param: Joi.object().allow(),
      simulation_response_info: Joi.object().allow(),
      response_format_type: Joi.string().valid("json", "xml").allow(),
      interface_type: Joi.string().allow(),
      error_info: Joi.object().allow(),
      preliminary_field: Joi.object().allow(),
   });

   validate(schema, req, res, next);
};
