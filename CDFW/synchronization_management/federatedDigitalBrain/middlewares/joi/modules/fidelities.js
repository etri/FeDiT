const Joi = require("joi");
const { validate } = require("./base/validate.js");

exports.create = (req, res, next) => {
    const schema = Joi.object({
        fidelity_id: Joi.string().allow(),
        federated_digital_twin_id: Joi.string().allow(),
        fidelity_name: Joi.string().required(),
        description: Joi.string().default(null),
        create_time: Joi.string().default(null),
        creator_id: Joi.string().default("anonymous"),
        modification_time: Joi.string().default(null),
        fidelity_subject: Joi.string().default(null),
        fidelity_type: Joi.string().default(null),
        data_unit_transform_info: Joi.string().default(null),
        input_output_info: Joi.string().default(null),

    });

    validate(schema, req, res, next);

};

exports.update = (req, res, next) => {

    const schema = Joi.object({

        fidelity_id: Joi.string().allow(),
        federated_digital_twin_id: Joi.string().allow(),
        fidelity_name: Joi.string().allow(),
        description: Joi.string().allow(),
        create_time: Joi.string().allow(),
        creator_id: Joi.string().allow(),
        modification_time: Joi.string().allow(),
        fidelity_subject: Joi.string().allow(),
        fidelity_type: Joi.string().allow(),
        data_unit_transform_info: Joi.string().allow(),
        input_output_info: Joi.string().allow(),
    });

    validate(schema, req, res, next);

};