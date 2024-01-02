const Model = require("../../models");
const ErrorHandler = require("../../lib/error-handler");
const model = new Model();
const lib = require("../../lib");
const config = require("../../config");

// federated digital twin simulation part
class Simulations {
   /**
    * simulation create
    * @param {String} simulation_id (system)
    * @param {String} federated_digital_twin_id (required)
    * @param {String} simulation_name (required)
    * @param {String} description (required)
    * @param {String array} tags (required)
    * @param {String} creation_time (system)
    * @param {String} creator_id (required)
    * @param {String} modification_time (system)
    * @param {String array} simulation_subject (required)
    * @param {String} simulation_access_url (required)
    * @param {String} authorization (required)
    * @param {JSON} simulation_request_param (required)
    * @param {JSON} simulation_response_info (required)
    * @param {String} response_format_type (required)
    * @param {String} interface_type (required)
    * @param {JSON} error_info (required)
    * @param {Integer} time_step (required)
    * @param {String} simulation_type (required)
    * @param {String array} simulation_attribute (optional)
    * @param {String} resource_type (required)
    * @param {String} include_input (required)
    * @param {Json} preliminary_field (optional)
    */
   async create(federated_digital_twin_id, digital_twin_id, params) {
      const isExistDtId = await model.postgres.checkIdExist({
         table: "federated_digital_twins",
         check: "federated_digital_twin_id",
         id: federated_digital_twin_id,
      });
      if (!isExistDtId) {
         throw new ErrorHandler(
            412,
            412,
            "Unregistered federated digital-twin"
         );
      }
      const {
         simulation_name,
         description,
         tags,
         subject,
         creation_time,
         modification_time,
         simulation_access_url,
         authorization,
         simulation_request_param,
         simulation_response_info,
         response_format_type,
         interface_type,
         error_info,
         preliminary_field,
      } = params;

      const simulation_id = "SIM" + uuid();
      const sql = `insert into simulations (
         digital_twin_id,
         simulation_id,
         federated_digital_twin_id,
         simulation_name,
         description,
         creation_time,
         modification_time,
         simulation_access_url,
         tags,
         subject,
         "authorization",
         simulation_request_param,
         simulation_response_info,
         response_format_type,
         interface_type,
         error_info,
         preliminary_field
      ) values ('${digital_twin_id}', 
      '${simulation_id}', 
      '${federated_digital_twin_id}', 
      '${simulation_name}', 
      '${description}', 
      '${creation_time}', 
      '${modification_time}', 
      '${simulation_access_url}', 
      '{${tags}}', 
      '${subject}', 
      '${authorization}', 
      '${JSON.stringify(simulation_request_param)}', 
      '${JSON.stringify(simulation_response_info)}', 
      '${response_format_type}', 
      '${interface_type}', 
      '${JSON.stringify(error_info)}', 
      '${JSON.stringify(preliminary_field)}');`;
      await model.postgres.sendQuery({ sql });

      return { simulation_id };
   }

   /**
    * 이름으로 저장된 simulation 검색
    * @param {string}
    * @returns {string}
    */
   async search({ federated_digital_twin_id, digital_twin_id, name }) {
      const isExistName = await model.postgres.checkNameExist({
         table: "simulations",
         check: "simulation_name",
         name,
         digital_twin_id,
         federated_digital_twin_id,
      });

      if (isExistName) {
         const sql = `select * from simulations where simulation_name = '${name}' and digital_twin_id = '${digital_twin_id}' and federated_digital_twin_id = '${federated_digital_twin_id}';`;
         const selectedData = await model.postgres.selectDataS({ sql });
         return selectedData;
      } else {
         throw new ErrorHandler(412, 412, "Unregistered simulations of FDT");
      }
   }

   /**
    * 저장된 simulation 조회
    * @param {string}
    * @returns {Json} {string}
    */
   async retrieve({
      federated_digital_twin_id,
      digital_twin_id,
      simulation_id,
   }) {
      const isExistID = await model.postgres.checkIdExist({
         table: "simulations",
         check: "simulation_id",
         id: simulation_id,
         digital_twin_id,
         federated_digital_twin_id,
      });
      // digitalObjects이 존재하면 조회
      if (isExistID) {
         const sql = `select * from simulations where simulation_id = '${simulation_id}' and digital_twin_id = '${digital_twin_id}' and federated_digital_twin_id = '${federated_digital_twin_id}'`;
         const selectedData = await model.postgres.selectData({ sql });
         return selectedData;
      } else {
         throw new ErrorHandler(412, 412, "Unregistered simulations of FDT");
      }
   }

   /**
    * simulation update
    * @param {String} simulation_id (system)
    * @param {String} simulation_name (required)
    * @param {String} description (required)
    * @param {String} creation_time (system)
    * @param {String} creator_id (required)
    * @param {String} modification_time (system)
    * @param {String array} simulation_subject (required)
    * @param {String} simulation_access_url (required)
    * @param {Integer} time_step (required)
    * @param {String} simulation_type (required)
    * @param {String array} simulation_attribute (optional)
    * @param {String} resource_type (required)
    * @param {String} include_input (required)
    * @returns {Json}
    */
   async update(
      { federated_digital_twin_id, digital_twin_id, simulation_id },
      params
   ) {
      const isExistID = await model.postgres.checkIdExist({
         table: "simulations",
         check: "simulation_id",
         id: simulation_id,
         digital_twin_id,
         federated_digital_twin_id,
      });
      if (!isExistID) {
         throw new ErrorHandler(412, 412, "Unregistered simulations of FDT");
      } else {
         let sql = `update simulations set `;
         let hasSetClause = false;
         for (let key in params) {
            if (key === "tags") {
               //string array type
               sql += `${hasSetClause ? ", " : ""}${key} = '{${params[key]}}'`;
            } else if (
               key === "simulation_request_param" ||
               key === "simulation_response_info" ||
               key === "error_info" ||
               key === "preliminary_field"
            ) {
               //json type
               sql += `${hasSetClause ? ", " : ""}${key} = '${JSON.stringify(
                  params[key]
               )}'`;
            } else if (key === "authorization") {
               sql += `${hasSetClause ? ", " : ""}"${key}" = '${params[key]}'`;
            } else {
               //string type
               sql += `${hasSetClause ? ", " : ""}${key} = '${params[key]}'`;
            }
            hasSetClause = true;
         }
         sql += ` where simulation_id = '${simulation_id}' and digital_twin_id = '${digital_twin_id}' and federated_digital_twin_id = '${federated_digital_twin_id}'`;
         await model.postgres.sendQuery({ sql });

         return { update: simulation_id };
      }
   }

   /**
    *  simulation 삭제
    * @param {string}
    * @returns {Json}
    */
   async delete({ federated_digital_twin_id, digital_twin_id, simulation_id }) {
      const isExistID = await model.postgres.checkIdExist({
         table: "simulations",
         check: "simulation_id",
         id: simulation_id,
         digital_twin_id,
         federated_digital_twin_id,
      });
      if (!isExistID) {
         throw new ErrorHandler(412, 412, "Unregistered simulation in FDT");
      } else {
         const sql = `delete from simulations where simulation_id = '${simulation_id}' and digital_twin_id = '${digital_twin_id}' and federated_digital_twin_id = '${federated_digital_twin_id}';`;
         await model.postgres.sendQuery({ sql });
         return { delete: simulation_id };
      }
   }

   /**
    * 저장된 모든 simulations의 이름 조회
    * @returns {List}
    */
   async getAll({ federated_digital_twin_id, digital_twin_id }) {
      const sql = `select * from simulations where federated_digital_twin_id = '${federated_digital_twin_id}' and digital_twin_id = '${digital_twin_id}';`;
      //const sql = `select * from simulations`;
      const simulationEntireList = await model.postgres.selectDataS({ sql });

      return simulationEntireList;
   }
}

module.exports = Simulations;
