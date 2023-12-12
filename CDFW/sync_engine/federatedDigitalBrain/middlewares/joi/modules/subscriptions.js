const Joi = require("joi");
const { validate } = require("./base/validate.js");

exports.create = (req, res, next) => {
   const schema = Joi.object({
      federated_digital_twin_id: Joi.string().allow(),
      subscription_name: Joi.string().required(),
      description: Joi.string().default(null),
      creator_id: Joi.string().default("anonymous"),
      subscription_subject: Joi.array()
         .items(Joi.string().required())
         .required(),
      subscription_protocol: Joi.string().valid("http", "mqtt").required(),
      notification_url: Joi.array().items(Joi.string().required()).required(),
      expiration_time: Joi.string().default(null),
      expiration_count: Joi.number().default(0),
      fail_count: Joi.number().default(0),
   });

   validate(schema, req, res, next);
};

exports.update = (req, res, next) => {
   const schema = Joi.object({
      federated_digital_twin_id: Joi.string().allow(),
      subscription_id: Joi.string().allow(),
      subscription_name: Joi.string().allow(),
      description: Joi.string().allow(),
      creator_id: Joi.string().allow(),
      subscription_subject: Joi.array().items(Joi.string()).allow(),
      subscription_protocol: Joi.string().valid("http", "mqtt").allow(),
      notification_url: Joi.array().items(Joi.string()).allow(),
      expiration_time: Joi.string().allow(),
      expiration_count: Joi.number().allow(),
      fail_count: Joi.number().allow(),
   });

   validate(schema, req, res, next);
};
