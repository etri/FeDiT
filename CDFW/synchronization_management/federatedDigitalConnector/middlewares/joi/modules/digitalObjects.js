const Joi = require("joi");
const { validate } = require("./base/validate.js");

exports.create = (req, res, next) => {
  const schema = Joi.object({
    digital_object_identifier: Joi.string().empty("").default(null),
    digital_object_name: Joi.string().required(),
    description: Joi.string().empty("").default(null).required(),
    keywords: Joi.array()
      .items(Joi.string().allow("").default("etc"))
      .default([])
      .required(),
    subjects: Joi.array()
      .items(Joi.string().allow("").default("etc"))
      .default([])
      .required(),
    creation_time: Joi.string().empty("").required(),
    modification_time: Joi.string().empty("").required(),
    digital_object_data_access_type: Joi.string()
      .empty("")
      .default(null)
      .required(),
    digital_object_data_access_url: Joi.string()
      // .empty("")
      .default(null)
      .required(),
    digital_object_data_source_type: Joi.string()
      .valid("PUSH", "POLL")
      .default("PUSH"),
    digital_object_data_source_url: Joi.string().empty("").default(null),
    digital_object_data_source_base_url: Joi.string().empty("").default(null),
    digital_object_control_url: Joi.string().default(null),
    digital_object_control_execution_timeout: Joi.number().default(null),
    digital_object_control_delivery_timeout: Joi.number().default(null),
    digital_object_data_model: Joi.object().default(null).required(),
    digital_object_data_interval: Joi.number().default(null).required(),
    digital_object_control_request_model: Joi.object().default(null).required(),
    do_metadata: Joi.object()
      .keys({
        sensors: Joi.array()
          .items(Joi.object().empty({}).default(null))
          .default([]),
        controllers: Joi.array()
          .items(Joi.object().empty({}).default(null))
          .default([]),
        visual_models: Joi.object().empty({}).default(null),
      })
      // .empty({})
      .default(null)
      .required(),
    preliminary_field: Joi.object().empty({}).default(null),
  });

  validate(schema, req, res, next);
};

exports.update = (req, res, next) => {
  const schema = Joi.object({
    digital_object_name: Joi.string().allow(),
    description: Joi.string().allow(),
    keywords: Joi.array().items().allow(),
    subjects: Joi.array().items().allow(),
    creation_time: Joi.string().allow(),
    modification_time: Joi.string().allow(),
    digital_object_data_access_type: Joi.string().allow(),
    digital_object_data_access_url: Joi.string().allow(),
    digital_object_data_source_type: Joi.string().valid("PUSH", "POLL").allow(),
    digital_object_data_source_url: Joi.string().allow(),
    digital_object_data_source_base_url: Joi.string().allow(),
    digital_object_control_url: Joi.string().allow(),
    digital_object_data_model: Joi.object().allow(),
    digital_object_data_interval: Joi.number().allow(),
    digital_object_control_request_model: Joi.object().empty({}).allow(),
    do_metadata: Joi.object().keys({
      sensors: Joi.array().items().allow(),
      controllers: Joi.array().items().allow(),
      visual_models: Joi.object().empty({}).allow(),
    }),
    preliminary_field: Joi.object().empty({}).allow(),
  });

  validate(schema, req, res, next);
};

exports.dataCreate = (req, res, next) => {
  const schema = Joi.object({
    rowtime: Joi.string().allow(),
    data: Joi.alternatives().try(Joi.object(), Joi.array()).required(),
    location: Joi.object().empty({}).default(null),
  });

  validate(schema, req, res, next);
};
