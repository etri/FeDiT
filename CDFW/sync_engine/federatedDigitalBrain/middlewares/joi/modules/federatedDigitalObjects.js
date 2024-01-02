const Joi = require("joi");
const { validate } = require("./base/validate.js");

exports.create = (req, res, next) => {
   const schema = Joi.object({
      federated_digital_twin_id: Joi.string().allow(),
      federated_digital_object_name: Joi.string().required(),
      description: Joi.string().empty("").default(null),
      tags: Joi.array()
         .items(Joi.string().allow("").default("etc"))
         .default([]),
      access_url: Joi.string().empty("").default(null),
      access_protocol: Joi.string().empty("").default(null),
      creator_id: Joi.string().default("anonymous"),
      location: Joi.object().empty({}).default(null),
      time_sync_cond: Joi.object()
         .keys({ time_interval: Joi.number() })
         .empty({})
         .default({ time_interval: 0 }),
      spatial_sync_cond: Joi.object().empty({}).default(null),
      member_digital_twin_object_ids: Joi.array()
         .items(Joi.string().allow("").default(""))
         .default([]),
      data_model_id: Joi.string().default(null),
      preliminary_field: Joi.object().empty({}).default(null),
   });
   validate(schema, req, res, next);
};

exports.update = (req, res, next) => {
   const schema = Joi.object({
      federated_digital_object_name: Joi.string().allow(),
      description: Joi.string().allow(),
      tags: Joi.array().items().allow(),
      access_url: Joi.string().allow(),
      access_protocol: Joi.string().allow(),
      creator_id: Joi.string().allow(),
      location: Joi.object().empty({}).default(null),
      time_sync_cond: Joi.object()
         .keys({ time_interval: Joi.number() })
         .empty({})
         .allow(),
      spatial_sync_cond: Joi.object().empty({}).allow(),
      member_digital_twin_object_ids: Joi.array().items().allow(),
      data_model_id: Joi.string().allow(),
      preliminary_field: Joi.object().empty({}).allow(),
   });

   validate(schema, req, res, next);
};

exports.controlCreate = (req, res, next) => {
   const schema = Joi.array().items(
      Joi.object({
         digital_twin_id: Joi.string().allow(),
         digital_object_id: Joi.string().required(),
         control_data_creator: Joi.string().required(),
         control_command: Joi.object().required(),
      })
   );
   validate(schema, req, res, next);
};
