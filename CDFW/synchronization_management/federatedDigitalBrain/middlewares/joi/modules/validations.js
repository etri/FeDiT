const Joi = require("joi");
const { validate } = require("./base/validate.js");


exports.create = (req, res, next) => {
    const schema = Joi.object({
        validation_id: Joi.string().allow(),
        federated_digital_twin_id: Joi.string().allow(),
        validation_name: Joi.string().required(),
        description: Joi.string().default(null),
        create_time: Joi.string().default(null),
        creator_id: Joi.string().default("anonymous"),
        modification_time: Joi.string().default(null),
        validation_rule: Joi.string().default(null),
        validation_subject: Joi.array().items(Joi.string().required()).required(),
        validation_engine_address: Joi.string().required(),
        validation_type: Joi.string().default(null),
        explainable: Joi.string().default(null),
        validation_result_history: Joi.string().default(null),
        notificationURL: Joi.string().default(null),
        input_output_info: Joi.string().default(null),
    });
 
    validate(schema, req, res, next);
 };
 

 exports.update = (req, res, next) => {
    const schema = Joi.object({

        validation_id: Joi.string().allow(),
        federated_digital_twin_id: Joi.string().allow(),
        validation_name: Joi.string().allow(),
        description: Joi.string().allow(),
        create_time: Joi.string().allow(),
        creator_id: Joi.string().allow(),
        modification_time: Joi.string().allow(),
        validation_rule: Joi.string().allow(),
        validation_subject: Joi.array().items(Joi.string()).allow(),
        validation_engine_address: Joi.string().allow(),
        validation_type: Joi.string().allow(),
        explainable: Joi.string().allow(),
        validation_result_history: Joi.string().allow(),
        notificationURL: Joi.string().allow(),
        input_output_info: Joi.string().allow(),
    });



 };