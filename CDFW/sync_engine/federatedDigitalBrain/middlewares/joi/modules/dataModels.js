const Joi = require("joi");
const { validate } = require("./base/validate.js");

exports.create = (req, res, next) => {
    const schema = Joi.object({
        data_model_id: Joi.string().allow(),
        digital_twin_id: Joi.string().allow(),
        digital_model_name: Joi.string().required(),
        description: Joi.string().default(null),
        creation_time: Joi.string().dafault(null),
        creator_id: Joi.string().default("anonymous"),
        modification_time: Joi.string().default(null),
        data_model_url: Joi.array().items(Joi.string().required()).required(),
        data_model: Joi.object().default({}),


    });


};

exports.update = (req, res, next) => {

    const schema = Joi.object({
        data_model_id: Joi.string().allow(),
        digital_twin_id: Joi.string().allow(),
        digital_model_name: Joi.string().allow(),
        description: Joi.string().allow(),
        creation_time: Joi.string().allow(),
        creator_id: Joi.string().allow(),
        modification_time: Joi.string().allow(),
        data_model_url: Joi.array().items(Joi.string()).allow(),
        data_model: Joi.object().allow(),
    });
};
