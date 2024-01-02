const Model = require("../../models");
const ErrorHandler = require("../../lib/error-handler");
const model = new Model();
const lib = require("../../lib");
const config = require("../../config");
class Services {
   /**
    * service create
    * @param {String} service_id (system)
    * @param {String} federated_digital_twin_id (required)
    * @param {String} service_name (required)
    * @param {String} description (required)
    * @param {String Array} tags (required)
    * @param {String} creation_time (system)
    * @param {String} creator_id (required)
    * @param {String} modification_time (system)
    * @param {String} service_access_url (required)
    * @param {String} authorization (required)
    * @param {String} service_request_param (required)
    * @param {String} service_response_info (required)
    * @param {String} response_format_type(required)
    * @param {String} interface_type (required)
    * @param {String} error_info (required)
    * @param {JSON} preliminary_field
    * @returns {Json}
    */
   async create(federated_digital_twin_id, params) {
      let serviceCount;
      const isExistDtId = await model.postgres.checkIdExist({
         table: "federated_digital_twins",
         check: "federated_digital_twin_id",
         id: federated_digital_twin_id,
      });
      if (!isExistDtId) {
         throw new ErrorHandler(
            412,
            412,
            "Unregistered federated-digital-twin"
         );
      } else {
         const selectFDTsql = `select * from federated_digital_twins where federated_digital_twin_id = '${federated_digital_twin_id}'`;
         const selectedFDTdata = await model.postgres.selectData({
            sql: selectFDTsql,
         });
         serviceCount = parseInt(selectedFDTdata.number_of_services) + 1;
      }
      const {
         service_name,
         description,
         tags,
         creator_id,
         service_access_url,
         authorization,
         service_request_param,
         service_response_info,
         response_format_type,
         interface_type,
         error_info,
         preliminary_field,
      } = params;

      const creationTime = lib.timestamp();
      const service_id = "FSER" + uuid();

      const upsertserviceCountSQL = `insert into federated_services (service_id, federated_digital_twin_id, service_name, description, tags, creation_time, modification_time, creator_id, service_access_url, "authorization", service_request_param, service_response_info, response_format_type, interface_type, error_info, preliminary_field) values ('${service_id}', '${federated_digital_twin_id}', '${service_name}', '${description}', '{${tags}}', '${creationTime}','${creationTime}', '${creator_id}', '${service_access_url}', '${authorization}', '${service_request_param}', '${service_response_info}', '${response_format_type}', '${interface_type}', '${error_info}', '${JSON.stringify(
         preliminary_field
      )}'); update federated_digital_twins set number_of_services = ${serviceCount}, modification_time = '${lib.timestamp()}' where federated_digital_twin_id = '${federated_digital_twin_id}'`;
      await model.postgres.sendQuery({ sql: upsertserviceCountSQL });

      await model.postgres.insertRelationInfo({
         parent_id: federated_digital_twin_id,
         resource_id: service_id,
         type: config.type.service,
      });

      return { service_id };
   }

   /**
    * 이름으로 저장된 service 검색
    * @param {string}
    * @returns {string}
    */
   async search({ federated_digital_twin_id, name }) {
      const isExistName = await model.postgres.checkNameExist({
         table: "federated_services",
         check: "service_name",
         name,
         federated_digital_twin_id,
      });

      if (isExistName) {
         const sql = `select * from federated_services where service_name = '${name}' and federated_digital_twin_id = '${federated_digital_twin_id}'`;
         const selectedData = await model.postgres.selectDataS({ sql });
         return selectedData;
      } else {
         throw new ErrorHandler(
            412,
            412,
            "Unregistered services under search function"
         );
      }
   }

   /**
    * 저장된 모든 service의 이름 조회
    * @returns {List}
    */
   async getAll({ federated_digital_twin_id }) {
      const sql = `select * from federated_services where federated_digital_twin_id = '${federated_digital_twin_id}';`;
      const serviceEntireList = await model.postgres.selectDataS({ sql });

      return serviceEntireList;
   }

   /**
    * 저장된 service 조회
    * @param {string}
    * @returns {Json} {string}
    */
   async retrieve({ federated_digital_twin_id, service_id }) {
      const isExistID = await model.postgres.checkIdExist({
         table: "federated_services",
         check: "service_id",
         id: service_id,
         federated_digital_twin_id,
      });
      // digitalObjects이 존재하면 조회
      if (isExistID) {
         const sql = `select * from federated_services where service_id = '${service_id}' and federated_digital_twin_id = '${federated_digital_twin_id}';`;
         const selectedData = await model.postgres.selectData({ sql });
         return selectedData;
      } else {
         throw new ErrorHandler(
            412,
            412,
            "Unregistered services under retrieve function"
         );
      }
   }

   /**
    * service update
    * @param {String} service_id
    * @returns {Json}
    */
   async update({ federated_digital_twin_id, service_id }, params) {
      const isExistID = await model.postgres.checkIdExist({
         table: "federated_services",
         check: "service_id",
         id: service_id,
         federated_digital_twin_id,
      });
      if (!isExistID) {
         throw new ErrorHandler(412, 412, "Unregistered services");
      } else {
         let sql = `update federated_services set `;
         for (let key in params) {
            if (key === "tags") {
               //string array type
               sql += `${key} = '{${params[key]}}', `;
            } else if (key === "preliminary_field") {
               //json type
               sql += `${key} = '${JSON.stringify(params[key])}', `;
            } else if (key === "authorization") {
               sql += `"${key}" = '${params[key]}', `;
            } else {
               //string type
               sql += `${key} = '${params[key]}', `;
            }
         }

         sql += ` modification_time='${lib.timestamp()}' where service_id = '${service_id}' and federated_digital_twin_id = '${federated_digital_twin_id}';`;

         await model.postgres.sendQuery({ sql });
         return { update: service_id };
      }
   }

   /**
    *  service 삭제
    * @param {string}
    * @returns {Json}
    */
   async delete({ federated_digital_twin_id, service_id }) {
      const isExistID = await model.postgres.checkIdExist({
         table: "federated_services",
         check: "service_id",
         id: service_id,
         federated_digital_twin_id,
      });

      if (!isExistID) {
         throw new ErrorHandler(412, 412, "Unregistered service");
      } else {
         const selectFDTsql = `select * from federated_digital_twins where federated_digital_twin_id = '${federated_digital_twin_id}'`;
         const selectedFDTdata = await model.postgres.selectData({
            sql: selectFDTsql,
         });
         const serviceCount = parseInt(selectedFDTdata.number_of_services) - 1;
         const sql = `delete from relations where resource_id = '{${service_id}}'; delete from federated_services where service_id = '${service_id}' and federated_digital_twin_id = '${federated_digital_twin_id}'; update federated_digital_twins set number_of_services = ${serviceCount}, modification_time = '${lib.timestamp()}' where federated_digital_twin_id = '${federated_digital_twin_id}';`;
         await model.postgres.sendQuery({ sql });

         return { delete: service_id };
      }
   }

   /**
    *  service execute
    * @param {string}
    * @returns {Json}
    */
   async execute({ federated_digital_twin_id, service_id }) {
      const isExistID = await model.postgres.checkIdExist({
         table: "federated_services",
         check: "service_id",
         id: service_id,
         federated_digital_twin_id,
      });
      // service이 존재하면 조회
      if (isExistID) {
         // kafka sink connector 생성
         await model.kafka.createServiceSinkConnector({});
         return { execute: service_id };
      } else {
         throw new ErrorHandler(412, 412, "Unregistered service");
      }
   }
}

module.exports = Services;
