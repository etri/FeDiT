const Joi = require("joi");
const { validate } = require("./base/validate.js");

exports.create = (req, res, next) => {
   const schema = Joi.object({
      digital_object_identifier: Joi.string().allow("").default(null),
      digital_object_name: Joi.string().required(),
      description: Joi.string().allow("").default(null),
      keywords: Joi.array()
         .items(Joi.string().allow("").default("etc"))
         .default([]),
      subjects: Joi.array()
         .items(Joi.string().allow("").default("etc"))
         .default([]),
      creation_time: Joi.string().allow("").default(null),
      modification_time: Joi.string().allow("").default(null),
      digital_object_data_access_type: Joi.string().allow("").default(null),
      digital_object_data_access_url: Joi.string().allow("").default(null),
      digital_object_data_source_type: Joi.string()
         .valid("PUSH", "POLL")
         .default("PUSH"),
      digital_object_data_source_url: Joi.string().allow("").default(null),
      digital_object_data_source_base_url: Joi.string().empty("").default(null),
      digital_object_control_url: Joi.string().allow("").default(null),
      digital_object_data_model: Joi.object().default(null),
      digital_object_data_interval: Joi.number().default(5000),
      digital_object_control_request_model: Joi.object().default(null),
      do_metadata: Joi.object()
         .keys({
            sensors: Joi.array().items(Joi.object().default(null)).default([]),
            controllers: Joi.array()
               .items(Joi.object().default(null))
               .default([]),
            visual_models: Joi.object().default(null),
         })
         .default({}),
      preliminary_field: Joi.object().default(null),
   });

   validate(schema, req, res, next);
};

exports.update = (req, res, next) => {
   const schema = Joi.object({
      digital_object_name: Joi.string().allow(""),
      description: Joi.string().allow(""),
      keywords: Joi.array().items().allow(),
      subjects: Joi.array().items().allow(),
      creation_time: Joi.string().allow(""),
      modification_time: Joi.string().allow(""),
      digital_object_data_access_type: Joi.string().allow(""),
      digital_object_data_access_url: Joi.string().allow(""),
      digital_object_data_source_type: Joi.string()
         .valid("PUSH", "POLL")
         .allow(),
      digital_object_data_source_url: Joi.string().allow(""),
      digital_object_data_source_base_url: Joi.string().allow(""),
      digital_object_control_url: Joi.string().allow(""),
      digital_object_data_model: Joi.object().allow(),
      digital_object_data_interval: Joi.number().allow(),
      digital_object_control_request_model: Joi.object().allow(),
      do_metadata: Joi.object().keys({
         sensors: Joi.array().items().allow(),
         controllers: Joi.array().items().allow(),
         visual_models: Joi.object().allow(),
      }),
      preliminary_field: Joi.object().allow(),
   });

   validate(schema, req, res, next);
};

exports.dataCreate = (req, res, next) => {
   const schema = Joi.object({
      data: Joi.object().required(),
      location: Joi.object().default(null),
   });

   validate(schema, req, res, next);
};
