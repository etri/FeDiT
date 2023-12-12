const Model = require("../../models");
const ErrorHandler = require("../../lib/error-handler");
const model = new Model();
const lib = require("../../lib/index");
const config = require("../../config");

class Subscriptions {
   /**
    * subscription create
    * @param {String} subscription_id (system)
    * @param {Json} federated_digital_twin_id (required)
    * @param {Json} subscription_name (required)
    * @param {String} description (required)
    * @param {String array} tags (required)
    * @param {String} creation_time (system)
    * @param {String} creator_id (required)
    * @param {String} modification_time (system)
    * @param {String array} subscription_subject (required)
    * @param {enum} subscription_protocol (required)
    * @param {String array} notification_url (required)
    * @param {timestamp} expiration_time (optional)
    * @param {Integer} expiration_count (optional)
    * @param {Integer} fail_count (optional)
    * @returns {Json} {}
    */
   async create(federated_digital_twin_id, params) {
      let subCount;
      const isExistDtId = await model.postgres.checkIdExist({
         table: "federated_digital_twins",
         check: "federated_digital_twin_id",
         id: federated_digital_twin_id,
      });
      if (!isExistDtId) {
         throw new ErrorHandler(412, 5252, "Unregistered federated_digital-twin");
      } else {
         const selectFDTsql = `select * from federated_digital_twins where federated_digital_twin_id = '${federated_digital_twin_id}'`;
         const selectedFDTdata = await model.postgres.selectData({
            sql: selectFDTsql,
         });
         subCount = parseInt(selectedFDTdata.number_of_subscriptions) + 1;
      }
      const {
         subscription_name,
         description,
         tags,
         creator_id,
         subscription_subject,
         subscription_protocol,
         notification_url,
         expiration_time,
         expiration_count,
         fail_count,
      } = params;

      const expiration_time_temp = expiration_time
         ? `'${expiration_time}'`
         : null;
      const creationTime = lib.timestamp();
      const subscription_id = "FSUB" + uuid();
      const insertsubscriptionDataSQL = `update federated_digital_twins set number_of_subscriptions = ${subCount}, modification_time = '${lib.timestamp()}' where federated_digital_twin_id = '${federated_digital_twin_id}'; insert into subscriptions (
         subscription_id,
         federated_digital_twin_id,
         subscription_name,
         description,
         creation_time,
         creator_id,
         modification_time,
         subscription_subject,
         subscription_protocol,
         expiration_time,
         expiration_count,
         fail_count,
         notification_url,
         tags
      ) values ('${subscription_id}', '${federated_digital_twin_id}', '${subscription_name}', '${description}', '${creationTime}', '${creator_id}', '${creationTime}', '{${subscription_subject}}', '${subscription_protocol}', ${expiration_time_temp}, '${expiration_count}', '${fail_count}', '{${notification_url}}', '{${tags}}');`;
      await model.postgres.sendQuery({ sql: insertsubscriptionDataSQL });
      await model.postgres.insertRelationInfo({
         parent_id: federated_digital_twin_id,
         resource_id: subscription_id,
         type: config.type.subscription,
      });

      //kafka sink connector 생성
      await model.kafka.createSubscriptionSinkConnector({
         federated_digital_twin_id,
         subscription_id,
         subscription_name,
         notification_url: lib.arryToString(notification_url),
         topics: lib.arryToEnum(subscription_subject),
         topicArr: subscription_subject,
         subscription_protocol,
      });

      return { subscription_id };
   }

   /**
    * 이름으로 저장된 subscription 검색
    * @param {string}
    * @returns {string}
    */
   async search({ federated_digital_twin_id, name }) {
      const isExistName = await model.postgres.checkNameExist({
         table: "subscriptions",
         check: "subscription_name",
         name: name,
         federated_digital_twin_id,
      });

      if (isExistName) {
         const sql = `select * from subscriptions where subscription_name = '${name}' and federated_digital_twin_id = '${federated_digital_twin_id}'`;
         const selectedData = await model.postgres.selectDataS({ sql });
         return selectedData;
      } else {
         throw new ErrorHandler(412, 5252, "Unregistered subscriptions in FDT");
      }
   }

   /**
    * 저장된 subscription 조회
    * @param {string} subscription_id
    * @returns {Json}
    */
   async retrieve({ federated_digital_twin_id, subscription_id }) {
      const isExistID = await model.postgres.checkIdExist({
         table: "subscriptions",
         check: "subscription_id",
         id: subscription_id,
      });
      // federatedDigitalObjects이 존재하면 조회
      if (isExistID) {
         const sql = `select * from subscriptions where subscription_id = '${subscription_id}' and federated_digital_twin_id = '${federated_digital_twin_id}'`;
         const selectedData = await model.postgres.selectData({ sql });
         return selectedData;
      } else {
         throw new ErrorHandler(412, 5252, "Unregistered subscriptions in FDT (retrieve function error)");
      }
   }

   /**
    * subscription update
    */
   async update({ federated_digital_twin_id, subscription_id }, params) {
      const isExistID = await model.postgres.checkIdExist({
         table: "subscriptions",
         check: "subscription_id",
         id: subscription_id,
         federated_digital_twin_id,
      });
      if (!isExistID) {
         throw new ErrorHandler(412, 5252, "Unregistered subscription");
      } else {
         let sql = `update subscriptions set `;
         for (let key in params) {
            if (
               key === "subscription_subject" ||
               key === "notification_url" ||
               key === "tags"
            ) {
               //string array type
               sql += `${key} = '{${lib.arryToEnum(params[key])}}', `;
            } else if (key === "expiration_count" || key === "fail_count") {
               // integer type
               sql += `${key} = ${params[key]}, `;
            } else {
               //string type
               sql += `${key} = '${params[key]}', `;
            }
         }
         sql += ` modification_time='${lib.timestamp()}' where subscription_id = '${subscription_id}' and federated_digital_twin_id = '${federated_digital_twin_id}'`;

         await model.postgres.sendQuery({ sql });
         if (params.subscription_subject || params.notification_url) {
            await this.execute({ federated_digital_twin_id, subscription_id });
         }

         return { update: subscription_id };
      }
   }

   // is neccessary?
   async execute({ digital_twin_id, subscription_id }) {
      const sql = `select * from subscriptions where subscription_id = '${subscription_id}' and digital_twin_id = '${digital_twin_id}'`;
      const selectedData = await model.postgres.selectData({ sql });
      const {
         subscription_name,
         subscription_subject,
         notification_url,
         subscription_protocol,
         expiration_time,
         expiration_count,
         fail_count,
      } = selectedData;

      const str_subscription_subject = lib.arryToString(subscription_subject);
      const str_subscription_url = lib.arryToString(notification_url);

      //kafka sink connector 생성
      await model.kafka.updateSubscriptionSinkConnector({
         digital_twin_id,
         subscription_id,
         subscription_name,
         notification_url: str_subscription_url,
         topics: str_subscription_subject,
         topicArr: subscription_subject,
         subscription_protocol,
      });

      return { execute: subscription_id };
   }

   /**
    *  subscription 삭제
    * @param {string} name
    * @returns {Json}
    */
   async delete({ federated_digital_twin_id, subscription_id }) {
      const isExistID = await model.postgres.checkIdExist({
         table: "subscriptions",
         check: "subscription_id",
         id: subscription_id,
         federated_digital_twin_id,
      });
      if (!isExistID) {
         throw new ErrorHandler(412, 5252, "Unregistered simulation in FDT (delete function error)");
      } else {
         const selectFDTsql = `select * from federated_digital_twins where federated_digital_twin_id = '${federated_digital_twin_id}'`;
         const selectedFDTdata = await model.postgres.selectData({
            sql: selectFDTsql,
         });
         const subCount = parseInt(selectedFDTdata.number_of_subscriptions) - 1;
         const sql = `delete from relations where resource_id = '{${subscription_id}}'; delete from subscriptions where subscription_id = '${subscription_id}' and federated_digital_twin_id = '${federated_digital_twin_id}'; update federated_digital_twins set number_of_subscriptions = ${subCount}, modification_time = '${lib.timestamp()}' where federated_digital_twin_id = '${federated_digital_twin_id}';`;
         await model.postgres.sendQuery({ sql });
         await model.kafka.deleteSink({
            type: "SUB",
            connectorName: subscription_id,
         });
         return { delete: subscription_id };
      }
   }

   /**
    * 저장된 모든 subscriptions의 이름 조회
    * @returns {List}
    */
   async getAll({ federated_digital_twin_id }) {
      const sql = `select * from subscriptions where federated_digital_twin_id = '${federated_digital_twin_id}';`;
      const subscriptionEntireList = await model.postgres.selectDataS({ sql });

      return subscriptionEntireList;
   }
}

module.exports = Subscriptions;
