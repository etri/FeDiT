const Model = require("../../models");
const model = new Model();
const config = require("../../config");
const ErrorHandler = require("../../lib/error-handler");
const lib = require("../../lib/index");

class FederatedDigitalTwins {
   /**
    * federatedDigitalTwin create
    * @param {String} federated_digital_twin_name (required)
    * @param {String} description (required) //필요성 검토
    * @param {String array} tags (required)
    * @param {String} point_of_access (required)
    * @param {String} creator_id (required)
    * @param {String} owner (required)
    * @param {JSON} location (optional)
    * @returns {Boolean} true
    */

   async create(params) {
      const {
         federated_digital_twin_name,
         description,
         owner,
         tags,
         point_of_access,
         creator_id,
         location,
      } = params;

      const creation_time = lib.timestamp();
      const federated_digital_twin_id = "F" + uuid();

      const sql = `insert into federated_digital_twins (
         federated_digital_twin_id,
         federated_digital_twin_name,
         description,
         owner,
         tags,
         point_of_access,
         creation_time,
         creator_id,
         modification_time,
         location,
         number_of_federated_digital_objects,
         number_of_subscriptions,
         number_of_services,
         number_of_simulations,
         number_of_digital_twins
      ) values ('${federated_digital_twin_id}', '${federated_digital_twin_name}',  '${description}', '${owner}', '{${tags}}', '${point_of_access}', '${creation_time}',
       '${creator_id}', '${creation_time}', '${JSON.stringify(
         location
      )}', 0, 0, 0, 0, 0);`;

      await model.postgres.sendQuery({ sql });

      return { federated_digital_twin_id };
   }

   /**
    * federated digitalTwin metaData export
    * @param {string} name
    * @returns {Json}
    */
   async Export({ federated_digital_twin_id }) {
      const isExistID = await model.postgres.checkIdExist({
         table: "federated_digital_twins",
         check: "federated_digital_twin_id",
         id: federated_digital_twin_id,
      });

      const resourceArr = [
         "digital_twins",
         "federated_digital_objects",
         "federated_data_models",
         "federated_fidelitys",
         "federated_services",
         "federated_simulations",
         "federated_subscriptions",
         "federated_validations",
         "federated_visual_models",
      ];

      if (isExistID) {
         const sql = `select * from federated_digital_twins where federated_digital_twin_id = '${federated_digital_twin_id}'`;
         const TwinResource = await model.postgres.selectData({ sql });
         let getAllResourceSQL = ``;
         for (const i in resourceArr) {
            getAllResourceSQL += `select * from ${resourceArr[i]} where federated_digital_twin_id = '${federated_digital_twin_id}'; `;
         }
         const resources = await model.postgres.select({
            sql: getAllResourceSQL,
         });

         for (let i = 0; i < resources.length; i++) {
            const rows = resources[i].rows;
            TwinResource[resourceArr[i]] = rows;
         }
         return TwinResource;
      } else {
         throw new ErrorHandler(
            412,
            412,
            "Unregistered federated-digital-twin"
         );
      }
   }

   /**
    * 저장된 federated digitalTwin 조회
    * @param {string} name
    * @returns {Json}
    */
   async Retrieve({ federated_digital_twin_id }) {
      const isExistID = await model.postgres.checkIdExist({
         table: "federated_digital_twins",
         check: "federated_digital_twin_id",
         id: federated_digital_twin_id,
      });
      // federated digitalTwin이 존재하면 조회
      if (isExistID) {
         const sql = `select * from federated_digital_twins where federated_digital_twin_id = '${federated_digital_twin_id}'`;
         const selectedData = await model.postgres.selectData({ sql });
         return selectedData;
      } else {
         throw new ErrorHandler(
            412,
            412,
            "Unregistered federated-digital-twin "
         );
      }
   }

   /**
    * 저장된 federated digitalTwin 검색
    * @param {string} name
    * @returns {Json}
    */
   async Search({ name }) {
      const isExistName = await model.postgres.checkNameExist({
         table: "federated_digital_twins",
         check: "federated_digital_twin_name",
         name,
      });

      if (isExistName) {
         const sql = `select * from federated_digital_twins where federated_digital_twin_name = '${name}'`;
         const selectedData = await model.postgres.selectDataS({ sql });
         return selectedData;
      } else {
         throw new ErrorHandler(
            412,
            412,
            "Unregistered federated-digital-twin"
         );
      }
   }

   /**
    * federated digitalTwin update
    * @param
    * @returns {Boolean} true
    */
   async update(federated_digital_twin_id, params) {
      const isExistID = await model.postgres.checkIdExist({
         table: "federated_digital_twins",
         check: "federated_digital_twin_id",
         id: federated_digital_twin_id,
      });
      // federated digitalTwin이 존재하면 조회
      if (!isExistID) {
         throw new ErrorHandler(
            412,
            412,
            "Unregistered federated-digital-twin"
         );
      } else {
         const modification_time = lib.timestamp();
         let sql = `update federated_digital_twins set `;
         for (let key in params) {
            if (key === "location") {
               sql += `${key} = '${JSON.stringify(params[key])}', `;
            } else if (key === "tags") {
               sql += `${key} = '{${params[key]}}', `;
            } else {
               sql += `${key} = '${params[key]}', `;
            }
         }
         sql += ` modification_time='${modification_time}' where federated_digital_twin_id = '${federated_digital_twin_id}'`;
         await model.postgres.sendQuery({ sql });

         return { update: federated_digital_twin_id };
      }
   }

   /**
    *  federated digitalTwin 삭제
    * @param {string} name
    * @returns {Json}
    */
   async delete({ id }) {
      const isExistID = await model.postgres.checkIdExist({
         table: "federated_digital_twins",
         check: "federated_digital_twin_id",
         id,
      });

      if (isExistID) {
         const sql = `delete from federated_digital_twins where federated_digital_twin_id = '${id}';
           delete from relations where resource_id = '{${id}}' or parent_id = '${id}';
           delete from digital_twins where federated_digital_twin_id = '${id}'; 
           delete from federated_digital_objects where federated_digital_twin_id = '${id}';
           delete from federated_digital_object_data where federated_digital_twin_id = '${id}';
           delete from federated_services where federated_digital_twin_id = '${id}';
           delete from federated_subscriptions where federated_digital_twin_id = '${id}';
           delete from federated_simulations where federated_digital_twin_id = '${id}';
           delete from federated_data_models where federated_digital_twin_id = '${id}';
           delete from federated_visual_models where federated_digital_twin_id = '${id}';
           delete from federated_validations where federated_digital_twin_id = '${id}';
           delete from federated_fidelities where federated_digital_twin_id = '${id}';
           delete from fdo_compositions where federated_digital_twin_id = '${id}';
           delete from fdo_sync_compositions where federated_digital_twin_id = '${id}';`;
         await model.postgres.sendQuery({ sql });

         await lib.request({
            method: "delete",
            url: `http://${config.federatedDigitalConnector.ip}${config.federatedDigitalConnector.port}/fedit/v1/federated-twins/${id}/digital-twins/undefind`,
         });
         return { delete: id };
      } else {
         throw new ErrorHandler(
            412,
            412,
            "Unregistered federated-digital-twin"
         );
      }
   }

   /**
    * 저장된 모든 federated-digitalTwin의 이름 조회
    * @returns {List}
    */
   async getAll() {
      const sql = `select * from federated_digital_twins`;
      const DTentireList = await model.postgres.selectDataS({ sql });

      return DTentireList;
   }
}

module.exports = FederatedDigitalTwins;
