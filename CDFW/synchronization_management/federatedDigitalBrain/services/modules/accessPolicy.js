const lib = require("../../lib");
const Model = require("../../models");
const ErrorHandler = require("../../lib/error-handler");
const model = new Model();

class AccessPolicy {
   /**
    * @param {String} access_policy_id (system)
    * @param {String} creation_time (system)
    * @param {String} creator_id (required)
    * @param {String} modification_time (system)
    * @param {String} read_passcode (optional)
    * @param {String} write_passcode (required)
    * @returns
    */
   async create(params) {
      const { creator_id, read_passcode, write_passcode } = params;
      if (!creator_id || !write_passcode) {
         throw new ErrorHandler(412, 5252, "please check mandatory field.");
      }

      const newTime = new Date(new Date().toUTCString());
      const creation_time = JSON.stringify(newTime);

      const access_policy_id = uuid();
      const sql = `insert into access_policy (
         access_policy_id,
         creation_time,
         creator_id,
         modification_time,
         read_passcode,
         write_passcode
      ) values ('${access_policy_id}', '${creation_time}', '${creator_id}', '${creation_time}', '${read_passcode}', '${write_passcode}');`;
      await model.postgres.sendQuery({ sql });

      return { access_policy_id: access_policy_id };
   }

   /**
    * 저장된 accessPolicy 조회
    * @param {string} name
    * @returns {Json}
    */
   async Retrieve({ access_policy_id }) {
      const isExistID = await model.postgres.checkIdExist({
         table: "access_policy",
         check: "access_policy_id",
         id: access_policy_id,
      });
      // accessPolicy이 존재하면 조회
      if (!isExistID) {
         throw new ErrorHandler(412, 5252, "Unregistered access-policy");
      } else {
         const sql = `select * from access_policy where access_policy_id = '${access_policy_id}'`;
         const selectedData = await model.postgres.selectData({ sql });
         return selectedData;
      }
   }

   /**
    * 저장된 accessPolicy 조회
    * @param {string} name
    * @returns {Json}
    */
   async RetrieveEntire() {
      const sql = `select * from access_policy`;
      const selectedData = await model.postgres.selectData({ sql });
      return selectedData;
   }

   /**
    * update
    * ** sql 수정 필요
    */
   async update(access_policy_id, { body }) {
      const isExistID = await model.postgres.checkIdExist({
         table: "access_policy",
         check: "access_policy_id",
         id: access_policy_id,
      });
      // accessPolicy이 존재하면 수정
      if (!isExistID) {
         throw new ErrorHandler(412, 5252, "Unregistered access-policy");
      } else {
         const sql = `select * from access_policy where access_policy_id = '${access_policy_id}'`;
         const selectedData = await model.postgres.selectData({ sql });
         return selectedData;
      }
   }

   /**
    * delete
    * ** sql 수정 필요
    */
   async delete({ access_policy_id }) {
      const isExistID = await model.postgres.checkIdExist({
         table: "access_policy",
         check: "access_policy_id",
         id: access_policy_id,
      });
      // accessPolicy이 존재하면 삭제
      if (!isExistID) {
         throw new ErrorHandler(412, 5252, "Unregistered access-policy");
      } else {
         const sql = `select * from access_policy where access_policy_id = '${access_policy_id}'`;
         const selectedData = await model.postgres.selectData({ sql });
         return selectedData;
      }
   }
}
module.exports = AccessPolicy;
