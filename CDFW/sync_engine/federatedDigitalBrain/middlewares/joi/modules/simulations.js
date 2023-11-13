const Joi = require("joi");
const { validate } = require("./base/validate.js");

exports.create = (req, res, next) => {
   const schema = Joi.object({
      federated_digital_twin_id: Joi.string().allow(),
      simulation_name: Joi.string().required(),
      description: Joi.string().default(null),
      tags: Joi.array()
         .items(Joi.string().allow("").default("etc"))
         .default([]),
      creator_id: Joi.string().default("anonymous"),
      simulation_subject: Joi.array().items(Joi.string().required()).required(),
      simulation_access_url: Joi.string().required(),
      authorization: Joi.string().default(null),
      simulation_request_param: Joi.object().default(null),
      simulation_response_info: Joi.object().default(null),
      response_format_type: Joi.string().valid("json", "xml").default(null),
      interface_type: Joi.string().default(null),
      error_info: Joi.object().default(null),
      time_step: Joi.number().required(),
      simulation_type: Joi.string()
         .valid("default", "later")
         .default("default"),
      simulation_attribute: Joi.array()
         .items(Joi.string().allow("").default(""))
         .default([]),
      resource_type: Joi.string()
         .valid("digital_object", "simulation")
         .required(),
      include_input: Joi.string().valid("true", "false").default("false"),
      preliminary_simulation_data_field: Joi.object().empty({}).default(null),
   });
   validate(schema, req, res, next);
};

exports.update = (req, res, next) => {
   const schema = Joi.object({
      federated_digital_twin_id: Joi.string().allow(),
      simulation_id: Joi.string().allow(),
      simulation_name: Joi.string().allow(),
      description: Joi.string().allow(),
      tags: Joi.array().items(Joi.string()).allow(),
      creator_id: Joi.string().allow(),
      simulation_subject: Joi.array().items(Joi.string()).allow(),
      simulation_access_url: Joi.string().allow(),
      authorization: Joi.string().allow(),
      simulation_request_param: Joi.object().allow(),
      simulation_response_info: Joi.string().allow(),
      response_format_type: Joi.string().allow(),
      interface_type: Joi.string().allow(),
      error_info: Joi.object().allow(),
      time_step: Joi.number().allow(),
      simulation_type: Joi.string().valid("default", "later").allow(),
      simulation_attribute: Joi.array().items(Joi.string()).allow(),
      resource_type: Joi.string().valid("digital_object", "simulation").allow(),
      include_input: Joi.string().allow(),
      preliminary_simulation_data_field: Joi.object().allow(),
   });

   validate(schema, req, res, next);
};
