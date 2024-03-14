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
         throw new ErrorHandler(
            412,
            412,
            "Unregistered federated_digital-twin"
         );
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
         filtering_action_list,
         filtering_condition_list,
      } = params;

      const topicList = await this.makeTopicList({ subscription_subject });

      const subscription_id = "FSUB" + uuid();

      const expiration_time_temp = expiration_time
         ? `'${expiration_time}'`
         : null;
      const creationTime = lib.timestamp();

      const insertsubscriptionDataSQL = `update federated_digital_twins set number_of_subscriptions = ${subCount}, modification_time = '${lib.timestamp()}' where federated_digital_twin_id = '${federated_digital_twin_id}'; insert into federated_subscriptions (
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
         tags,
         filtering_action_list,
         filtering_condition_list
      ) values ('${subscription_id}', '${federated_digital_twin_id}', '${subscription_name}', '${description}', '${creationTime}', '${creator_id}', 
      '${creationTime}', '{${subscription_subject}}', '${subscription_protocol}', ${expiration_time_temp}, ${expiration_count}, ${fail_count}, 
      '{${notification_url}}', '{${tags}}', '${filtering_action_list}', '${filtering_condition_list}');`;
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
         topics: lib.arryToString(subscription_subject),
         topicList,
         subscription_protocol,
         filtering_action_list,
         filtering_condition_list,
      });

      return { subscription_id };
   }

   async makeTopicList({ subscription_subject }) {
      let checkSQL = ``;
      for (const subject of subscription_subject) {
         checkSQL += `
         SELECT 
    CASE
        WHEN digital_objects.digital_object_id IS NOT NULL THEN 'digital_objects'
        WHEN federated_digital_objects.federated_digital_object_id IS NOT NULL THEN 'federated_digital_objects'
        WHEN federated_simulations.simulation_id IS NOT NULL THEN 'simulation_result'
        ELSE 'Not Found'
    END AS subject_type
FROM 
    digital_objects
FULL OUTER JOIN 
    federated_digital_objects ON digital_objects.digital_object_id = federated_digital_objects.federated_digital_object_id
FULL OUTER JOIN
    federated_simulations ON digital_objects.digital_object_id = federated_simulations.simulation_id
WHERE 
    digital_objects.digital_object_id = '${subject}' OR federated_digital_objects.federated_digital_object_id = '${subject}' OR federated_simulations.simulation_id = '${subject}';`;
      }

      const selectedData = await model.postgres.selectDataRows({
         sql: checkSQL,
      });

      let topicList = "";
      if (!selectedData) {
         throw new ErrorHandler(412, 412, `Unregistered subscription_subject`);
      } else {
         const topicSet = new Set();
         if (Array.isArray(selectedData)) {
            for (let i = 0; i < selectedData.length; i++) {
               const row = selectedData[i].rows[0];
               if (row) {
                  if (row.subject_type === "digital_objects") {
                     topicSet.add("UnalliedDigitalObjects");
                  } else if (row.subject_type === "federated_digital_objects") {
                     if (!topicSet.has("latestFederatedDigitalObjects")) {
                        topicSet.add("latestFederatedDigitalObjects");
                     }
                  } else if (row.subject_type === "simulation_result") {
                     topicSet.add(`${subscription_subject[i]}_result`);
                  }
               } else {
                  throw new ErrorHandler(
                     412,
                     412,
                     `Unregistered subscription_subject '${subscription_subject[i]}'`
                  );
               }
            }
         } else {
            const row = selectedData.rows[0];
            if (row?.subject_type) {
               if (row.subject_type === "digital_objects") {
                  topicSet.add("UnalliedDigitalObjects");
               } else if (row.subject_type === "federated_digital_objects") {
                  if (!topicSet.has("latestFederatedDigitalObjects")) {
                     topicSet.add("latestFederatedDigitalObjects");
                  }
               } else if (row.subject_type === "simulation_result") {
                  topicSet.add(`${subscription_subject[0]}_result`);
               }
            } else {
               throw new ErrorHandler(
                  412,
                  412,
                  `Unregistered subscription_subject '${subscription_subject[0]}'`
               );
            }
         }

         if (topicSet.size > 0) {
            topicList = Array.from(topicSet).join(",");
         } else {
            topicList = subscription_subject.join(",");
         }
      }

      return topicList;
   }

   /**
    * 이름으로 저장된 subscription 검색
    * @param {string}
    * @returns {string}
    */
   async search({ federated_digital_twin_id, name }) {
      const isExistName = await model.postgres.checkNameExist({
         table: "federated_subscriptions",
         check: "subscription_name",
         name: name,
         federated_digital_twin_id,
      });

      if (isExistName) {
         const sql = `select * from federated_subscriptions where subscription_name = '${name}' and federated_digital_twin_id = '${federated_digital_twin_id}'`;
         const selectedData = await model.postgres.selectDataS({ sql });
         return selectedData;
      } else {
         throw new ErrorHandler(412, 412, "Unregistered subscriptions");
      }
   }

   /**
    * 저장된 subscription 조회
    * @param {string} subscription_id
    * @returns {Json}
    */
   async retrieve({ federated_digital_twin_id, subscription_id }) {
      const isExistID = await model.postgres.checkIdExist({
         table: "federated_subscriptions",
         check: "subscription_id",
         id: subscription_id,
      });
      // federatedDigitalObjects이 존재하면 조회
      if (isExistID) {
         const sql = `select * from federated_subscriptions where subscription_id = '${subscription_id}' and federated_digital_twin_id = '${federated_digital_twin_id}';`;
         const selectedData = await model.postgres.selectData({ sql });
         return selectedData;
      } else {
         throw new ErrorHandler(412, 412, "Unregistered subscription");
      }
   }

   /**
    * subscription update
    */
   async update({ federated_digital_twin_id, subscription_id }, params) {
      const isExistID = await model.postgres.checkIdExist({
         table: "federated_subscriptions",
         check: "subscription_id",
         id: subscription_id,
         federated_digital_twin_id,
      });
      if (!isExistID) {
         throw new ErrorHandler(412, 412, "Unregistered subscription");
      } else {
         let sql = `update federated_subscriptions set `;
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
         if (
            params.subscription_subject ||
            params.notification_url ||
            params.filtering_action_list ||
            params.filtering_condition_list
         ) {
            await this.execute({ federated_digital_twin_id, subscription_id });
         }

         return { update: subscription_id };
      }
   }

   async execute({ federated_digital_twin_id, subscription_id }) {
      const sql = `select * from federated_subscriptions where subscription_id = '${subscription_id}' and federated_digital_twin_id = '${federated_digital_twin_id}'`;
      const selectedData = await model.postgres.selectData({ sql });
      const {
         subscription_name,
         subscription_subject,
         notification_url,
         subscription_protocol,
         expiration_time,
         expiration_count,
         fail_count,
         filtering_action_list,
         filtering_condition_list,
      } = selectedData;

      const str_subscription_subject = lib.arryToString(subscription_subject);
      const str_subscription_url = lib.arryToString(notification_url);
      const topicList = await this.makeTopicList({ subscription_subject });

      //kafka sink connector 생성
      await model.kafka.updateSubscriptionSinkConnector({
         federated_digital_twin_id,
         subscription_id,
         subscription_name,
         notification_url: str_subscription_url,
         topics: str_subscription_subject,
         topicList,
         subscription_protocol,
         filtering_action_list,
         filtering_condition_list,
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
         table: "federated_subscriptions",
         check: "subscription_id",
         id: subscription_id,
         federated_digital_twin_id,
      });
      if (!isExistID) {
         throw new ErrorHandler(412, 412, "Unregistered simulation");
      } else {
         const selectFDTsql = `select * from federated_digital_twins where federated_digital_twin_id = '${federated_digital_twin_id}';`;
         const selectedFDTdata = await model.postgres.selectData({
            sql: selectFDTsql,
         });
         const subCount = parseInt(selectedFDTdata.number_of_subscriptions) - 1;
         const sql = `delete from relations where resource_id = '{${subscription_id}}'; delete from federated_subscriptions where subscription_id = '${subscription_id}' and federated_digital_twin_id = '${federated_digital_twin_id}'; update federated_digital_twins set number_of_subscriptions = ${subCount}, modification_time = '${lib.timestamp()}' where federated_digital_twin_id = '${federated_digital_twin_id}';`;
         await model.postgres.sendQuery({ sql });
         await model.kafka.deleteSink({
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
      const sql = `select * from federated_subscriptions where federated_digital_twin_id = '${federated_digital_twin_id}';`;
      const subscriptionEntireList = await model.postgres.selectDataS({ sql });

      return subscriptionEntireList;
   }
}

module.exports = Subscriptions;
