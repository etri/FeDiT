const ErrorHandler = require("../../lib/error-handler");
const logger = require("../../lib/logger");

class Ajv {
  /**
   * Control Command Json Schema Validate
   * @param {Object} command
   */
  async checkCommandValid({ command }) {
    const doid = command.digital_object_id;
    const control_command = command.control_command;
    let query = `SELECT digital_object_control_request_model FROM digital_objects where digital_object_id = '${doid}'`
    const result = await global.pool.query(query);
    const digital_object_control_request_model = result.rows[0].digital_object_control_request_model;

    console.log(digital_object_control_request_model);
    if (digital_object_control_request_model.control_model == null) {
      return "true"
    } else {
      const validate = ajv.compile(digital_object_control_request_model.control_model)
      const valid = validate(control_command)
      if (!valid) {
        return validate.errors
      } else {
        return "true"
      }
    }
  }
}

module.exports = Ajv;