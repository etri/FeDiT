const Model = require("../../models");
const ErrorHandler = require("../../lib/error-handler");
const model = new Model();
const lib = require("../../lib");
const config = require("../../config");

class Simulations {
   /**
    * simulation create
    * @param {String} simulation_id (system)
    * @param {String} simulation_name (required)
    * @param {String} description (required)
    * @param {String array} keywords (required)
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
   async create(digital_twin_id, params) {
      const {
         simulation_identifier,
         simulation_name,
         description,
         keywords,
         subjects,
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

      let simulation_id = simulation_identifier || "SIM" + uuid();

      if (simulation_identifier) {
         const isExistSimId = await model.postgres.checkIdExist({
            table: "simulations",
            check: "simulation_id",
            id: simulation_identifier,
         });
         if (isExistSimId) {
            throw new ErrorHandler(
               412,
               412,
               "simulation_identifier already in use"
            );
         }
      }

      const formattedCreationTime = creation_time ? `'${creation_time}'` : null;
      const formattedModificationTime = modification_time
         ? `'${modification_time}'`
         : null;
      const sql = `insert into simulations (
         digital_twin_id,
         simulation_id,
         simulation_name,
         description,
         creation_time,
         modification_time,
         simulation_access_url,
         keywords,
         subjects,
         "authorization",
         simulation_request_param,
         simulation_response_info,
         response_format_type,
         interface_type,
         error_info,
         preliminary_field
      ) values ('${digital_twin_id}', 
      '${simulation_id}', 
      '${simulation_name}', 
      '${description}', 
      ${formattedCreationTime},
      ${formattedModificationTime},
      '${simulation_access_url}', 
      '{${keywords}}', 
      '{${subjects}}', 
      '${authorization}', 
      '${JSON.stringify(simulation_request_param)}', 
      '${JSON.stringify(simulation_response_info)}', 
      '${response_format_type}', 
      '${interface_type}', 
      '${JSON.stringify(error_info)}', 
      '${JSON.stringify(preliminary_field)}');`;
      await model.postgres.sendQuery({ sql });

      client.refreshMetadata([`${simulation_id}_result`], (err) => {
         if (err) {
            console.warn("Error refreshing kafka metadata", err);
         }
      });

      return { simulation_id };
   }

   /**
    * 이름으로 저장된 simulation 검색
    * @param {string}
    * @returns {string}
    */
   async search({ digital_twin_id, name }) {
      const isExistName = await model.postgres.checkNameExist({
         table: "simulations",
         check: "simulation_name",
         name,
         digital_twin_id,
      });

      if (isExistName) {
         const sql = `select * from simulations where simulation_name = '${name}' and digital_twin_id = '${digital_twin_id}';`;
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
   async retrieve({ digital_twin_id, simulation_id }) {
      const isExistID = await model.postgres.checkIdExist({
         table: "simulations",
         check: "simulation_id",
         id: simulation_id,
         digital_twin_id,
      });
      // digitalObjects이 존재하면 조회
      if (isExistID) {
         const sql = `select * from simulations where simulation_id = '${simulation_id}' and digital_twin_id = '${digital_twin_id}'`;
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
   async update({ digital_twin_id, simulation_id }, params) {
      const isExistID = await model.postgres.checkIdExist({
         table: "simulations",
         check: "simulation_id",
         id: simulation_id,
         digital_twin_id,
      });
      if (!isExistID) {
         throw new ErrorHandler(412, 412, "Unregistered simulations of FDT");
      } else {
         let sql = `update simulations set `;
         let hasSetClause = false;
         for (let key in params) {
            if (key === "keywords" || key === "subjects") {
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
         sql += ` where simulation_id = '${simulation_id}' and digital_twin_id = '${digital_twin_id}'`;
         await model.postgres.sendQuery({ sql });

         return { update: simulation_id };
      }
   }

   /**
    *  simulation 삭제
    * @param {string}
    * @returns {Json}
    */
   async delete({ digital_twin_id, simulation_id }) {
      const isExistID = await model.postgres.checkIdExist({
         table: "simulations",
         check: "simulation_id",
         id: simulation_id,
         digital_twin_id,
      });
      if (!isExistID) {
         throw new ErrorHandler(412, 412, "Unregistered simulation in FDT");
      } else {
         const sql = `delete from simulations where simulation_id = '${simulation_id}' and digital_twin_id = '${digital_twin_id}';
         delete from simulation_data where simulation_id = '${simulation_id}' and digital_twin_id = '${digital_twin_id}';`;
         await model.postgres.sendQuery({ sql });
         return { delete: simulation_id };
      }
   }

   /**
    * 저장된 모든 simulations의 이름 조회
    * @returns {List}
    */
   async getAll({ digital_twin_id }) {
      const sql = `select * from simulations where digital_twin_id = '${digital_twin_id}';`;
      const simulationEntireList = await model.postgres.selectDataS({ sql });

      return simulationEntireList;
   }

   /**
    *  simulation dataCreate
    * @param {string}
    * @returns {Json}
    */
   async dataCreate({ digital_twin_id, simulation_id }, body) {
      const isExistID = await model.postgres.checkIdExist({
         table: "simulations",
         check: "simulation_id",
         id: simulation_id,
         digital_twin_id,
      });
      // simulation이 존재하면 조회
      if (isExistID) {
         const sql = `select * from simulations where simulation_id = '${simulation_id}' and digital_twin_id = '${digital_twin_id}';`;
         const selectedData = await model.postgres.selectData({ sql });
         const { simulation_name, simulation_access_url } = selectedData;

         const simulation_data_id = `S${uuid()}`;
         const trigger_time = lib.timestamp();
         const simulationBody = {
            digital_twin_id,
            rowtime: trigger_time,
            simulation_id,
            simulation_name,
            input_data: body,
         };

         const result = await lib.request({
            url: simulation_access_url,
            bodyParams: simulationBody,
         });

         const result_data = result.data ? result.data : JSON.stringify(result);

         const input_data = JSON.stringify(body);
         const simulationResultBody = {
            simulation_id,
            simulation_data_id,
            trigger_time,
            result_time: lib.timestamp(),
            input_data,
            result_data,
         };

         const kafkaKey = { simulation_data_id };
         model.kafka.kafkaProducer({
            topic: `${simulation_id}_result`,
            kafkaKey: JSON.stringify(kafkaKey),
            data: JSON.stringify(simulationResultBody),
         }); //string

         let Updatesql = `insert into simulation_data (digital_twin_id, simulation_data_id, simulation_id, input_data, result_data, trigger_time, result_time) values ('${digital_twin_id}', '${simulation_data_id}', '${simulation_id}', '${input_data}', '${result_data}', '${trigger_time}', '${lib.timestamp()}')`;

         await model.postgres.sendQuery({ sql: Updatesql });

         return { dataCreate: simulation_data_id };
      } else {
         return "Unregistered simulation";
      }
   }

   /**
    *  simulation result asynchronous input
    * @param {string}
    * @returns {Json}
    */
   async resultAsyncUpdate({
      digital_twin_id,
      simulation_id,
      simulation_data_id,
      result_data,
   }) {
      const isExistSimulationID = await model.postgres.checkIdExist({
         table: "simulations",
         check: "simulation_id",
         id: simulation_id,
         digital_twin_id,
      });

      const isExistSimulationDataID = await model.postgres.checkIdExist({
         table: "simulation_data",
         check: "simulation_data_id",
         id: simulation_data_id,
      });

      if (isExistSimulationID) {
         if (isExistSimulationDataID) {
            let sql = `update simulation_data set result_data='${JSON.stringify(
               result_data
            )}', result_time='${lib.timestamp()}' where simulation_id = '${simulation_id}' and simulation_data_id = '${simulation_data_id}'`;
            await model.postgres.sendQuery({ sql });

            return { simulation_data_id };
         } else {
            return "Unregistered simulation_data";
         }
      } else {
         return "Unregistered simulation";
      }
   }
   /**
    *  simulation dataRetrieve
    * @param {string}
    * @returns {Json}
    */
   async dataRetrieve({ digital_twin_id, simulation_id, from, to, count }) {
      const isExistID = await model.postgres.checkIdExist({
         table: "simulations",
         check: "simulation_id",
         id: simulation_id,
         digital_twin_id,
      });
      if (!isExistID) {
         throw new ErrorHandler(412, 5252, "Unregistered simulation");
      }

      if (from && to) {
         const sql = `SELECT * FROM simulation_data WHERE simulation_id = '${simulation_id}' AND trigger_time >= '${from}'::timestamp AND trigger_time <= '${to}'::timestamp;`;
         const retrievedData = await model.postgres.selectDataS({ sql });
         return retrievedData;
      } else if (count) {
         const sql = `SELECT * FROM simulation_data WHERE simulation_id = '${simulation_id}' order by trigger_time desc limit ${count};`;
         const retrievedData = await model.postgres.selectDataS({ sql });
         return retrievedData;
      } else {
         const sql = `SELECT * FROM simulation_data WHERE simulation_id = '${simulation_id}' order by trigger_time desc limit 100;`;
         const retrievedData = await model.postgres.selectDataS({ sql });
         return retrievedData;
      }
   }
}

module.exports = Simulations;
