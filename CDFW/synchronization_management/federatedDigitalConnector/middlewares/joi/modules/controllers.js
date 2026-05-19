const Joi = require("joi");
const { validate } = require("./base/validate.js");

exports.create = (req, res, next) => {
   const schema = Joi.object({
      digital_twin_id: Joi.string().allow(),
      controller_name: Joi.string().required(),
      description: Joi.string().default(null),
      owner: Joi.string().default("anonymous"),
      keywords: Joi.array()
         .items(Joi.string().allow("").default("etc"))
         .default([]),
      install_location: Joi.object().empty({}).default(null),
      install_time: Joi.string().empty("").default(null),
      creator_id: Joi.string().default("anonymous"),
      control_access_type: Joi.string().required(),
      control_access_url: Joi.string().required(),
      acknowledgement_type: Joi.string().empty("").default(null),
      delivery_timeout: Joi.number().default(null),
      execution_timeout: Joi.number().default(null),
      timeout_notification: Joi.string().empty("").default(null),
      data_model_id: Joi.string().empty("").default(null),
   });

   validate(schema, req, res, next);
};

exports.update = (req, res, next) => {
   const schema = Joi.object({
      digital_twin_id: Joi.string().allow(),
      controller_id: Joi.string().allow(),
      controller_name: Joi.string().allow(),
      description: Joi.string().allow(),
      owner: Joi.string().allow(),
      keywords: Joi.array().items(Joi.string()).allow(),
      install_location: Joi.object().allow(),
      install_time: Joi.string().allow(),
      creator_id: Joi.string().allow(),
      control_access_type: Joi.string().allow(),
      control_access_url: Joi.string().allow(),
      acknowledgement_type: Joi.string().allow(),
      delivery_timeout: Joi.number().allow(),
      execution_timeout: Joi.number().allow(),
      timeout_notification: Joi.string().allow(),
      data_model_id: Joi.string().allow(),
   });

   validate(schema, req, res, next);
};

exports.DataCreate = (req, res, next) => {
   const schema = Joi.object({
      digital_twin_id: Joi.string().required(),
      digital_object_id: Joi.string().required(),
      federated_digital_twin_id: Joi.string().required(),
      federated_digital_object_id: Joi.string().required(),
      federated_digital_object_control_data_id: Joi.string().required(),
      control_command: Joi.alternatives()
         .try(Joi.object(), Joi.string())
         .required(),
   });

   validate(schema, req, res, next);
};

/**
 * Not Used
 */
exports.DataResultCreate = (req, res, next) => {
   const schema = Joi.object({
      federated_digital_object_control_data_id: Joi.string().required(),
      digital_object_id: Joi.string().required(),
      control_execution_result: Joi.alternatives()
         .try(Joi.object(), Joi.string())
         .required(),
   });

   validate(schema, req, res, next);
};
