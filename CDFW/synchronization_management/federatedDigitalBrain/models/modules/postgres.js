const ErrorHandler = require("../../lib/error-handler");
const logger = require("../../lib/logger");

class Postgres {
   /**
    * deleteSQL: DELETE FROM table_name WHERE name = '${}' ;
    * @param {sql} param0
    * @returns
    */
   async sendQuery({ sql }) {
      return pool
         .query(sql)
         .then((response) => {
            return response.command;
         })
         .catch((e) => {
            throw e;
         });
   }

   async selectDataRows({ sql }) {
      return pool
         .query(sql)
         .then((response) => {
            if (response) {
               return response;
            } else {
               return [];
            }
         })
         .catch((e) => {
            throw e;
         });
   }

   async selectData({ sql }) {
      return pool
         .query(sql)
         .then((response) => {
            if (response.rowCount) {
               return response.rows[0];
            } else {
               return [];
            }
         })
         .catch((e) => {
            throw e;
         });
   }

   async selectDataS({ sql }) {
      return pool
         .query(sql)
         .then((response) => {
            if (response.rowCount) {
               return response.rows;
            } else {
               //if no response
               return [];
            }
         })
         .catch((e) => {
            throw e;
         });
   }

   async select({ sql }) {
      return pool.query(sql);
   }

   async dropTable({ name }) {
      const sql = `drop table ${name}`;
      return pool
         .query(sql)
         .then((response) => {
            return response.command;
         })
         .catch((e) => {
            throw e;
         });
   }

   async deleteRow({ table, where, data }) {
      const sql = `delete from ${table} where ${where}='${data}';`;
      return pool
         .query(sql)
         .then((response) => {
            return response.command;
         })
         .catch((e) => {
            throw e;
         });
   }

   /**
    * 테이블에 이름으로 검색해서 존재하는지 확인
    * @param {String} table (required)
    * tableList: digital_twin_list, do_list, controller_list, visualmodel_list, datamodel_list, intelligencemodel_list, service_list, simulation_list, subscription_list
    * @param {String} check (required)
    * check -> nameList: digital_twin_name, digital_object_name...
    * @param {String} name (required)
    * @returns {Boolean} true = 이미 존재 하는 이름
    */
   async checkNameExist({ table, check, name, federated_digital_twin_id }) {
      let sql = "";
      if (federated_digital_twin_id) {
         sql = `select exists(select * from ${table} where ${check} = '${name}' and federated_digital_twin_id = '${federated_digital_twin_id}');`;
      } else {
         sql = `select exists(select * from ${table} where ${check} = '${name}');`;
      }
      return pool
         .query(sql)
         .then((response) => {
            if (response.rows[0].exists) {
               return true;
            } else {
               return false;
            }
         })
         .catch((e) => {
            throw e;
         });
   }

   /**
    * 테이블에 id으로 검색해서 존재하는지 확인
    * @param {String} table (required)
    * tableList: catalog_list, do_list, controller_list, visualmodel_list, datamodel_list, intelligencemodel_list, service_list, simulation_list, subscription_list
    * @param {String} check (required)
    *     * check -> nameList: federated_digital_twin_id, digital_object_id...
    * @param {String} id (required)
    * @returns {Boolean} true = 이미 존재 하는 이름
    */
   async checkIdExist({ table, check, id, federated_digital_twin_id }) {
      let sql = "";
      if (federated_digital_twin_id) {
         sql = `select exists(select * from ${table} where ${check} = '${id}' and federated_digital_twin_id = '${federated_digital_twin_id}');`;
      } else {
         sql = `select exists(select * from ${table} where ${check} = '${id}');`;
      }
      return pool
         .query(sql)
         .then((response) => {
            if (response.rows[0].exists) {
               return true;
            } else {
               return false;
            }
         })
         .catch((e) => {
            console.log(e);
            throw e;
         });
   }

   checkTableExistence = async (tableName) => {
      const query = `
         SELECT EXISTS (
            SELECT 1
            FROM information_schema.tables
            WHERE table_name = $1
         );
      `;

      const result = await global.pool.query(query, [tableName]);
      return result.rows[0].exists;
   };

   TableExistCheck = async ({ connectors }) => {
      try {
         const existences = await Promise.all(
            connectors.map(this.checkTableExistence)
         );
         return existences;
      } catch (error) {
         console.error("Error checking table existence:", error);
         throw error;
      }
   };

   /**
    * insert relation information to relations table
    * type: {"federatedTwin":0,"digitalTwin":1,"digitalObject":2,"sensor":3,"controller":4,"visualModel":5,"dataModel":6,"behaviorModel":7,"simulation":8,"service":9,"subscription":10}
    * @param {String} parent_id (required)
    * @param {String} resource_id (required)
    * @param {String} type (required)
    * @returns {Boolean} true
    */
   async insertRelationInfo({ parent_id, resource_id, type }) {
      const sql = `INSERT INTO relations(parent_id, resource_id, type) VALUES('${parent_id}','{${resource_id}}',${type});`;
      return pool
         .query(sql)
         .then((response) => {
            return response.command;
         })
         .catch((e) => {
            throw e;
         });
   }

   async createinsertRelationSQL({ parent_id, resource_id, type }) {
      const sql = `INSERT INTO relations(parent_id, resource_id, type) VALUES('${parent_id}','{${resource_id}}',${type});`;
      return sql;
   }

   /**creator_id를 받아 권한이 있는지확인하여 true false check
    * check access policy
    * @param {String} parent_id (required)
    * @param {String} resource_id (required)
    * @param {String} type (required)
    * @returns {Boolean} true
    */
   async checkAccessPolicy({ parent_id, resource_id, type }) {
      const sql = `INSERT INTO relations(parent_id, resource_id, type) VALUES('${parent_id}','{${resource_id}}',${type});`;
      return pool
         .query(sql)
         .then((response) => {
            return response.command;
         })
         .catch((e) => {
            throw e;
         });
   }
}

module.exports = Postgres;
