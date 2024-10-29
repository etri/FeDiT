const Joi = require("joi");
const { validate } = require("./base/validate.js");

exports.create = (req, res, next) => {
   const schema = Joi.object({
      digital_twin_identifier: Joi.string().allow("").default(null),
      digital_twin_name: Joi.string().required(),
      description: Joi.string().allow("").default(null),
      owner: Joi.string().default("anonymous"),
      keywords: Joi.array()
         .items(Joi.string().allow("").default("etc"))
         .default([]),
      creation_time: Joi.string().allow("").default(null),
      creator_id: Joi.string().default("anonymous"),
      modification_time: Joi.string().allow("").default(null),
      point_of_access: Joi.string().allow("").default(null),
      contact_point: Joi.string().allow("").default(null),
      subjects: Joi.array()
         .items(Joi.string().allow("").default("etc"))
         .default([]),
      location: Joi.object().empty({}).default(null),
      member_digital_objects_ids: Joi.array().default(null),
      number_of_digital_objects: Joi.number().default(null),
      number_of_services: Joi.number().default(null),
      number_of_simulations: Joi.number().default(null),
   });
   validate(schema, req, res, next);
};

//creation_time 빼고 전부다
exports.update = (req, res, next) => {
   const schema = Joi.object({
      digital_twin_name: Joi.string().allow(),
      description: Joi.string().allow(),
      owner: Joi.string().allow(),
      keywords: Joi.array().items(Joi.string()).allow(),
      creator_id: Joi.string().allow(),
      modification_time: Joi.string().allow(),
      point_of_access: Joi.string().allow(),
      contact_point: Joi.string().allow(),
      subjects: Joi.array().items(Joi.string()).allow(),
      location: Joi.object().allow(),
      member_digital_objects_ids: Joi.array().allow(),
      number_of_digital_objects: Joi.number().allow(),
      number_of_services: Joi.number().allow(),
      number_of_simulations: Joi.number().allow(),
   });
   validate(schema, req, res, next);
};
