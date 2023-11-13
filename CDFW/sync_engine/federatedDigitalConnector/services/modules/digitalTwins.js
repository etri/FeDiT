const Model = require("../../models");
const model = new Model();
const ErrorHandler = require("../../lib/error-handler");
const lib = require("../../lib/index");
const config = require("../../config");
const mirrorlake_id = config.mirrorlake.id;
class DigitalTwins {
   /**
    * digitalTwin information create in FDT Meta data
    * @param {String} federated_digital_twin_id (system)
    * @param {String} digital_twin_id (required)
    * @param {String} digital_twin_name (required)
    * @param {String} description (optional)
    * @param {String} owner (opitional)
    * @param {array} tags (optional)
    * @param {String} creation_time (system)
    * @param {String} creator_id (optional)
    * @param {String} modification_time (optional)
    * @param {String} point_of_access (optional)
    * @param {String} contact_point (optional)
    * @param {String} subject (optional)
    * @param {JSON} location (required)
    * @param {array} member_digital_objects_ids (required)
    * @param {number} number_of_digital_objects (required)
    * @param {number} number_of_services (required)
    * @param {number} number_of_simulations (required)
    * @returns {Boolean} true
    */
   async create(federated_twin_id, params) {
      //이거는 single dt의 digital object라고 정의하고 작성 할 것.
      const {
         digital_twin_name,
         description,
         owner,
         tags,
         creation_time,
         creator_id,
         modification_time,
         point_of_access,
         contact_point,
         subject,
         location,
         member_digital_objects_ids,
         number_of_digital_objects,
         number_of_services,
         number_of_simulations,
      } = params;

      const digital_twin_id = "DT" + uuid();
      const creation_time_temp = creation_time ? `'${creation_time}'` : null;
      const modification_time_temp = modification_time
         ? `'${modification_time}'`
         : null;
      //member_digital_objects_ids에서 각 DO가 정의되어 있는 DO인지 확인 해야 됨

      for (let i in member_digital_objects_ids) {
         let isExistID = await model.posrgres.checkIdExist({
            table: "digital_objects",
            check: "digital_object_id",
            id: member_digital_objects_ids[i],
         });
         if (!isExistID) {
            throw new ErrorHandler(412, 5252, "Unregistered digital object");
         }
      }

      const sql = `insert into digital_twins (
         federated_digital_twin_id,
         digital_twin_id,
         digital_twin_name,
         description,
         owner,
         tags,
         creation_time,
         creator_id,
         modification_time,
         point_of_access,
         contact_point,
         subject,
         location,
         member_digital_objects_ids,
         number_of_digital_objects,
         number_of_services,
         number_of_simulations
      ) values ('${federated_twin_id}','${digital_twin_id}', '${digital_twin_name}',  
       '${description}', '${owner}', '{${tags}}', ${creation_time_temp}, '${creator_id}', 
      ${modification_time_temp},'${point_of_access}', '${contact_point}', '{${subject}}', '${JSON.stringify(
         location
      )}', 
      '{${member_digital_objects_ids}}', ${number_of_digital_objects}, ${number_of_services}, ${number_of_simulations});`;

      const res = await model.postgres.sendQuery({ sql });
      // await model.postgres.insertRelationInfo({
      //    parent_id: mirrorlake_id,
      //    resource_id: federated_digital_twin_id,
      //    type: 1,
      // });

      return { digital_twin_id };
   }

   /**
    * digitalTwin metaData export in federated_digital_twin
    * 필요하지 않을까?
    * @param {string} name
    * @returns {Json}
    */
   async Export({ federated_twin_id }) {
      const isExistID = await model.postgres.checkIdExist({
         table: "federated_digital_twins",
         check: "federated_digital_twin_id",
         id: federated_twin_id,
      });

      const resourceArr = ["digital_objects", "services", "simulations"];

      if (isExistID) {
         const list_sql = `select digital_twin_id from digital_twins where federated_digital_twin_id = '${federated_twin_id}'`;
         const Twinlist = await model.postgres.selectData({ sql });

         const total_return = {};

         for (const tmp_twin_id in Twinlist) {
            const sql = `select * from digital_twins where digital_twin_id = '${tmp_twin_id}'`;
            const TwinResource = await model.postgres.selectData({ sql });
            let getAllResourceSQL = ``;
            for (const i in resourceArr) {
               getAllResourceSQL += `select * from ${resourceArr[i]} where digital_twin_id = '${digital_twin_id}'; `;
            }
            const resources = await model.postgres.select({
               sql: getAllResourceSQL,
            });

            for (let i = 0; i < resources.length; i++) {
               const rows = resources[i].rows;
               TwinResource[resourceArr[i]] = rows;
            }
            total_return += TwinResource;
         }
         return total_return;
      } else {
         throw new ErrorHandler(
            412,
            5252,
            "Unregistered federated_digital-twin"
         );
      }
   }

   /**
    * federated_digital_twin 내에 저장된 특정 digitalTwin 아이디로 조회
    * @param {string} id
    * @returns {Json}
    */
   async Retrieve({ federated_twin_id, digital_twin_id }) {
      const isExistID = await model.postgres.checkIdExist({
         table: "federated_digital_twins",
         check: "federated_digital_twin_id",
         id: federated_twin_id,
      });
      // federated_digital_Twin이 존재하면 조회
      if (isExistID) {
         const sql = `select * from digital_twins where federated_digital_twin_id = '${federated_twin_id}' and digital_twin_id = '${digital_twin_id}'`;
         const selectedData = await model.postgres.selectData({ sql });
         return selectedData;
      } else {
         throw new ErrorHandler(
            412,
            5252,
            "Unregistered digital-twin via twin_id"
         );
      }
   }

   /**
    * federated_digital_twin 내에 저장된 특정 digitalTwin 이름으로 검색
    * @param {string} name
    * @returns {Json}
    */
   async Search({ federated_twin_id, name }) {
      const isExistID = await model.postgres.checkIdExist({
         table: "federated_digital_twins",
         check: "federated_digital_twin_id",
         id: federated_twin_id,
      });
      // federated_digital_Twin이 존재하면 조회
      if (isExistID) {
         const sql = `select * from digital_twins where federated_digital_twin_id = '${federated_twin_id}' and digital_twin_name = '${name}'`;
         const selectedData = await model.postgres.selectData({ sql });
         return selectedData;
      } else {
         throw new ErrorHandler(
            412,
            5252,
            "Unregistered digital-twin via name"
         );
      }
   }

   /**
    * digitalTwin update
    * @param
    * @returns {Boolean} true
    */
   async update(federated_twin_id, digital_twin_id, params) {
      const isExistFID = await model.postgres.checkIdExist({
         table: "federated_digital_twins",
         check: "federated_digital_twin_id",
         id: federated_twin_id,
      });

      const isExistID = await model.postgres.checkIdExist({
         table: "digital_twins",
         check: "digital_twin_id",
         id: digital_twin_id,
      });

      // digitalTwin이 존재하면 조회
      if (!isExistID && !isExistFID) {
         throw new ErrorHandler(
            412,
            5252,
            "Unregistered federated_digital-twin or digital_twin"
         );
      } else {
         let sql = `update digital_twins set `;
         for (let key in params) {
            if (key === "location") {
               sql += `${key} = '${JSON.stringify(params[key])}', `;
            } else if (
               key === "tags" ||
               key === "subject" ||
               key === "member_digital_objects_ids"
            ) {
               sql += `${key} = '{${params[key]}}', `;
            } else {
               sql += `${key} = '${params[key]}', `;
            }
         }
         sql += ` modification_time='${lib.timestamp()}' where federated_digital_twin_id = '${federated_twin_id}' 
         and digital_twin_id = '${digital_twin_id}'`;
         await model.postgres.sendQuery({ sql });

         return { update: digital_twin_id };
      }
   }

   /**
    *  digitalTwin 삭제
    * @param {string} name
    * @returns {Json}
    */
   async delete({ federated_twin_id, digital_twin_id }) {
      const isExistFID = await model.postgres.checkIdExist({
         table: "federated_digital_twins",
         check: "federated_digital_twin_id",
         id: federated_twin_id,
      });

      const isExistID = await model.postgres.checkIdExist({
         table: "digital_twins",
         check: "digital_twin_id",
         id: digital_twin_id,
      });

      //delete from relations where resource_id = '{${digital_twin_id}}' or parent_id = '${digital_twin_id}';
      if (isExistID && isExistFID) {
         const sql = `delete from digital_twins where digital_twin_id = '${digital_twin_id}' and 
         federated_digital_twin_id = '${federated_twin_id}'; 
         delete from digital_objects where digital_twin_id = '${digital_twin_id}'; 
         delete from simulations where digital_twin_id = '${digital_twin_id}'; 
         delete from services where digital_twin_id = '${digital_twin_id}';`;
         await model.postgres.sendQuery({ sql });

         return { delete: digital_twin_id };
      } else {
         throw new ErrorHandler(
            412,
            5252,
            "Unregistered digital-twin or already deleted"
         );
      }
   }

   /**
    * 저장된 모든 digitalTwin의 이름 조회
    * @returns {List}
    */
   async getAll({ federated_twin_id }) {
      const sql = `select * from digital_twins where federated_digital_twin_id = '${federated_twin_id}'`;
      const DTentireList = await model.postgres.selectDataS({ sql });

      return DTentireList;
   }
}

module.exports = DigitalTwins;
