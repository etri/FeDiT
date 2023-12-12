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
   async create(federated_digital_twin_id, params) {
      let simCount;
      const isExistDtId = await model.postgres.checkIdExist({
         table: "federated_digital_twins",
         check: "federated_digital_twin_id",
         id: federated_digital_twin_id,
      });
      if (!isExistDtId) {
         throw new ErrorHandler(412, 5252, "Unregistered federated digital-twin");
      } else {
         const selectFDTsql = `select * from federated_digital_twins where federated_digital_twin_id = '${federated_digital_twin_id}'`;
         const selectedFDTdata = await model.postgres.selectData({
            sql: selectFDTsql,
         });
         simCount = parseInt(selectedFDTdata.number_of_simulations) + 1;
      }

      const {
         simulation_name,
         description,
         tags,
         creator_id,
         simulation_subject,
         simulation_access_url,
         authorization,
         simulation_request_param,
         simulation_response_info,
         response_format_type,
         interface_type,
         error_info,
         time_step,
         simulation_type,
         simulation_attribute,
         resource_type,
         include_input,
         preliminary_field,
      } = params;

      let checkExistID;
      let existArr = [];
      if (resource_type == "federated_digital_object") {
         for (let item = 0; item < simulation_subject.length; item++) {
            checkExistID = await model.postgres.checkIdExist({
               table: "federated_digital_objects",
               check: "federated_digital_object_id",
               id: simulation_subject[item],
               federated_digital_twin_id,
            });
            existArr.push(checkExistID);
         }

         for (let i = 0; i < existArr.length; i++) {
            if (existArr[i] === false) {
               throw new ErrorHandler(
                  412,
                  5252,
                  `Unregistered federated-simulation_subject`
               );
            }
         }
      } else if (resource_type == "simulation") {
         for (let item = 0; item < simulation_subject.length; item++) {
            checkExistID = await model.postgres.checkIdExist({
               table: "simulations",
               check: "simulation_id",
               id: simulation_subject[item],
               federated_digital_twin_id,
            });
            existArr.push(checkExistID);
         }

         for (let i = 0; i < existArr.length; i++) {
            if (existArr[i] === false) {
               throw new ErrorHandler(
                  412,
                  5252,
                  `Unregistered simulation_subject of FDT`
               );
            }
         }
      }

      const creationTime = lib.timestamp();
      const simulation_id = "FSIM" + uuid();

      const insertSimulationDataSQL = `insert into simulations (
         simulation_id,
         federated_digital_twin_id,
         simulation_name,
         description,
         creation_time,
         creator_id,
         modification_time,
         simulation_subject,
         simulation_access_url,
         time_step,
         simulation_type,
         simulation_attribute,
         resource_type,
         include_input,
         tags,
         "authorization",
         simulation_request_param,
         simulation_response_info,
         response_format_type,
         interface_type,
         error_info,
         preliminary_field
      ) values ('${simulation_id}', '${federated_digital_twin_id}', '${simulation_name}', '${description}', '${creationTime}', '${creator_id}', '${creationTime}', '{${simulation_subject}}', '${simulation_access_url}', '${time_step}', '${simulation_type}', '{${simulation_attribute}}', '${resource_type}', '${include_input}', '{${tags}}', '${authorization}', '${JSON.stringify(
         simulation_request_param
      )}', '${JSON.stringify(
         simulation_response_info
      )}', '${response_format_type}', '${interface_type}', '${JSON.stringify(
         error_info
      )}', '${JSON.stringify(preliminary_field)}');`;
      await model.postgres.sendQuery({ sql: insertSimulationDataSQL });
      await model.postgres.insertRelationInfo({
         parent_id: federated_digital_twin_id,
         resource_id: simulation_id,
         type: config.type.simulation,
      });

      const updatesimCountSQL = `update federated_digital_twins set number_of_simulations = ${simCount}, modification_time = '${lib.timestamp()}' where federated_digital_twin_id = '${federated_digital_twin_id}'`;
      await model.postgres.sendQuery({ sql: updatesimCountSQL });

      return { simulation_id };
   }

   /**
    * 이름으로 저장된 simulation 검색
    * @param {string}
    * @returns {string}
    */
   async search({ federated_digital_twin_id, name }) {
      const isExistName = await model.postgres.checkNameExist({
         table: "simulations",
         check: "simulation_name",
         name,
         federated_digital_twin_id,
      });

      if (isExistName) {
         const sql = `select * from simulations where simulation_name = '${name}' and federated_digital_twin_id = '${federated_digital_twin_id}'`;
         const selectedData = await model.postgres.selectDataS({ sql });
         return selectedData;
      } else {
         throw new ErrorHandler(412, 5252, "Unregistered simulations of FDT");
      }
   }

   /**
    * 저장된 simulation 조회
    * @param {string}
    * @returns {Json} {string}
    */
   async retrieve({ federated_digital_twin_id, simulation_id }) {
      const isExistID = await model.postgres.checkIdExist({
         table: "simulations",
         check: "simulation_id",
         id: simulation_id,
         federated_digital_twin_id,
      });
      // digitalObjects이 존재하면 조회
      if (isExistID) {
         const sql = `select * from simulations where simulation_id = '${simulation_id}' and federated_digital_twin_id = '${federated_digital_twin_id}'`;
         const selectedData = await model.postgres.selectData({ sql });
         return selectedData;
      } else {
         throw new ErrorHandler(412, 5252, "Unregistered simulations of FDT");
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
   async update({ federated_digital_twin_id, simulation_id }, params) {
      const isExistID = await model.postgres.checkIdExist({
         table: "simulations",
         check: "simulation_id",
         id: simulation_id,
         federated_digital_twin_id,
      });
      if (!isExistID) {
         throw new ErrorHandler(412, 5252, "Unregistered simulations of FDT");
      } else {
         let checkExistID;
         let existArr = [];
         if (params.resource_type == "federated_digital_object") {
            for (
               let item = 0;
               item < params.simulation_subject.length;
               item++
            ) {
               checkExistID = await model.postgres.checkIdExist({
                  table: "federated_digital_objects",
                  check: "federated_digital_object_id",
                  id: params.simulation_subject[item],
                  federated_digital_twin_id,
               });
               existArr.push(checkExistID);
            }

            for (let i = 0; i < existArr.length; i++) {
               if (existArr[i] === false) {
                  throw new ErrorHandler(
                     412,
                     5252,
                     `Unregistered simulation_subject of FDT in federated-digital-object`
                  );
               }
            }
         } else if (params.resource_type == "simulation") {
            for (
               let item = 0;
               item < params.simulation_subject.length;
               item++
            ) {
               checkExistID = await model.postgres.checkIdExist({
                  table: "simulations",
                  check: "simulation_id",
                  id: params.simulation_subject[item],
                  federated_digital_twin_id,
               });
               existArr.push(checkExistID);
            }

            for (let i = 0; i < existArr.length; i++) {
               if (existArr[i] === false) {
                  throw new ErrorHandler(
                     412,
                     5252,
                     `Unregistered simulation_subject of FDT in type of simulation`
                  );
               }
            }
         }

         let sql = `update simulations set `;
         for (let key in params) {
            if (
               key === "simulation_subject" ||
               key === "simulation_attribute" ||
               key === "tags"
            ) {
               //string array type
               sql += `${key} = '{${params[key]}}', `;
            } else if (
               key === "simulation_request_param" ||
               key === "simulation_response_info" ||
               key === "error_info" ||
               key === "preliminary_field"
            ) {
               //json type
               sql += `${key} = '${JSON.stringify(params[key])}', `;
            } else if (key === "time_step") {
               // integer type
               sql += `${key} = ${params[key]}, `;
            } else if (key === "authorization") {
               sql += `"${key}" = '${value}'`;
            } else {
               //string type
               sql += `${key} = '${params[key]}', `;
            }
         }
         sql += ` modification_time='${lib.timestamp()}' where simulation_id = '${simulation_id}' and federated_digital_twin_id = '${federated_digital_twin_id}'`;
         await model.postgres.sendQuery({ sql });

         if (
            params.simulation_subject ||
            params.time_step ||
            params.simulation_type ||
            params.resource_type ||
            params.include_input
         ) {
            await this.execute({
               federated_digital_twin_id,
               simulation_id,
               caseOfcreate: "put",
            });
         }

         return { update: simulation_id };
      }
   }

   /**
    *  simulation 삭제
    * @param {string}
    * @returns {Json}
    */
   async delete({ federated_digital_twin_id, simulation_id }) {
      const isExistID = await model.postgres.checkIdExist({
         table: "simulations",
         check: "simulation_id",
         id: simulation_id,
         federated_digital_twin_id,
      });
      if (!isExistID) {
         throw new ErrorHandler(412, 5252, "Unregistered simulation in FDT");
      } else {
         const selectFDTsql = `select * from federated_digital_twins where federated_digital_twin_id = '${federated_digital_twin_id}'`;
         const selectedFDTdata = await model.postgres.selectData({
            sql: selectFDTsql,
         });
         const simCount = parseInt(selectedFDTdata.number_of_simulations) - 1;
         const sql = `delete from relations where resource_id = '{${simulation_id}}'; delete from simulations where simulation_id = '${simulation_id}' and federated_digital_twin_id = '${federated_digital_twin_id}'; delete from simulation_data where simulation_id = '${simulation_id}'; update federated_digital_twins set number_of_simulations = ${simCount}, modification_time = '${lib.timestamp()}' where federated_digital_twin_id = '${federated_digital_twin_id}';`;
         await model.postgres.sendQuery({ sql });
         await model.kafka.deleteSink({
            type: "SIM",
            connectorName: simulation_id,
         });
         await model.kafka.deleteSink({
            type: "DigitalBase_",
            connectorName: `${simulation_id}_result`,
         });
         return { delete: simulation_id };
      }
   }

   /**
    * [request body] simulation execute format
    * select * from simulations where simulation_id
    * {
    "simulation_id": "S41268ede3ad78624a759c81d2ccb6bc3",
    "digital_twin_id": "D46d8c5717a08988190a816a71edff08e",
    "simulation_name": "tsim03",
    "description": "test simulation",
    "creation_time": "2023-03-21T07:29:21.236Z",
    "creator_id": "ssul",
    "modification_time": "2023-03-21T07:29:21.236Z",
    "simulation_subject": [
        "D1"
    ],
    "simulation_access_url": "http://localhost:1234/receiver",
    "time_step": 100,
    "simulation_type": "response",
    "simulation_attribute": [
        "temperature"
    ]
}
    * @param {string}
    * @returns {Json}
    */
   async execute({ federated_digital_twin_id, simulation_id, caseOfcreate }) {
      const isExistID = await model.postgres.checkIdExist({
         table: "simulations",
         check: "simulation_id",
         id: simulation_id,
         federated_digital_twin_id,
      });
      // simulation이 존재하면 조회
      if (isExistID) {
         const sql = `select * from simulations where simulation_id = '${simulation_id}' and federated_digital_twin_id = '${federated_digital_twin_id}'`;
         const selectedData = await model.postgres.selectData({ sql });
         const {
            simulation_name,
            simulation_subject,
            simulation_access_url,
            simulation_attribute,
            time_step,
            resource_type,
            include_input,
         } = selectedData;

         const str_simulation_subject = lib.arryToString(simulation_subject);
         let str_simulation_attribute = lib.arryToString(simulation_attribute);

         if (!str_simulation_attribute) {
            str_simulation_attribute = "";
         }

         // kafka sink connector 생성
         if (caseOfcreate) {
            //put
            await model.kafka.updateSimulationSinkConnector({
               digital_twin_id,
               simulation_id,
               simulation_name,
               simulation_subject: str_simulation_subject,
               simulation_access_url,
               simulation_attribute: str_simulation_attribute,
               time_step,
               resource_type,
               include_input,
            });
         } else {
            //post
            await model.kafka.createSimulationSinkConnector({
               digital_twin_id,
               simulation_id,
               simulation_name,
               simulation_subject: str_simulation_subject,
               simulation_access_url,
               simulation_attribute: str_simulation_attribute,
               time_step,
               resource_type,
               include_input,
            });

            await model.kafka.createPostgresSinkConnector({
               topic: `${simulation_id}_result`,
               table: "simulation_data",
               type: "simulation_result",
            });
         }

         return { execute: simulation_id };
      } else {
         throw new ErrorHandler(412, 5252, "Unregistered simulations of execute in FDT");
      }
   }

   /**
    *  simulation 데이터 피딩 중지
    * @param {string}
    * @returns {Json}
    */
   async termination({ federated_digital_twin_id, simulation_id }) {
      const isExistID = await model.postgres.checkIdExist({
         table: "simulations",
         check: "simulation_id",
         id: simulation_id,
         federated_digital_twin_id,
      });
      // simulation이 존재하면 조회
      if (isExistID) {
         return { termination: simulation_id };
      } else {
         return "Unregistered simulation in FDT";
      }
   }

   /**
    *  simulation dataCreate
    * @param {string}
    * @returns {Json}
    */
   async dataCreate({ federated_digital_twin_id, simulation_id }) {
      const isExistID = await model.postgres.checkIdExist({
         table: "simulations",
         check: "simulation_id",
         id: simulation_id,
         federated_digital_twin_id,
      });
      // simulation이 존재하면 조회
      if (isExistID) {
         return { dataCreate: simulation_id };
      } else {
         return "Unregistered simulation of dataCreate in FDT";
      }
   }

   /**
    *  simulation dataRetrieve
    * @param {string}
    * @returns {Json}
    */
   async dataRetrieve({ federated_digital_twin_id, simulation_id, from, to, count }) {
      const isExistID = await model.postgres.checkIdExist({
         table: "simulations",
         check: "simulation_id",
         id: simulation_id,
         federated_digital_twin_id,
      });
      if (!isExistID) {
         throw new ErrorHandler(412, 5252, "Unregistered simulation of dataRetrieve in FDT");
      }

      if (from && to) {
         const sql = `SELECT * FROM simulation_data WHERE simulation_id = '${simulation_id}' AND rowtime >= '${from}'::timestamp AND rowtime <= '${to}'::timestamp;`;
         const retrievedData = await model.postgres.selectDataS({ sql });
         return retrievedData;
      } else if (count) {
         const sql = `SELECT * FROM simulation_data WHERE simulation_id = '${simulation_id}' order by rowtime desc limit ${count};`;
         const retrievedData = await model.postgres.selectDataS({ sql });
         return retrievedData;
      } else {
         const sql = `SELECT * FROM simulation_data WHERE simulation_id = '${simulation_id}' order by rowtime desc limit 100;`;
         const retrievedData = await model.postgres.selectDataS({ sql });
         return retrievedData;
      }
   }

   /**
    * 저장된 모든 simulations의 이름 조회
    * @returns {List}
    */
   async getAll({ federated_digital_twin_id }) {
      const sql = `select * from simulations where federated_digital_twin_id = '${federated_digital_twin_id}';`;
      //const sql = `select * from simulations`;
      const simulationEntireList = await model.postgres.selectDataS({ sql });

      return simulationEntireList;
   }
}

module.exports = Simulations;
