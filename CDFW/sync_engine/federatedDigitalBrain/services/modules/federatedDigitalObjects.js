const ErrorHandler = require("../../lib/error-handler");
const lib = require("../../lib/index");
const config = require("../../config");
const Model = require("../../models");
const model = new Model();
const { stringify } = require("wkt");

class FederatedDigitalObjects {
   /**
    * @param {String} federated_digital_twin_id (required)
    * @param {String} federated_digital_object_name (required)
    * @param {String} description (optional)
    * @param {String array} tags (required)
    * @param {String} access_url (optional)
    * @param {String} access_protocol (optional)
    * @param {String} creator_id (required)
    * @param {Json} time_sync_cond (optional)
    * @param {Json} spatial_sync_cond (optional)
    * @param {String array} member_digital_twin_object_ids (required)
    * @param {String} data_model_id (required)
    * @param {Json} preliminary_field (optional)
    *
    * @returns {Json} {}
    */
   async create(federated_digital_twin_id, params) {
      try {
         const isExistDtId = await model.postgres.checkIdExist({
            table: "federated_digital_twins",
            check: "federated_digital_twin_id",
            id: federated_digital_twin_id,
         });
         if (!isExistDtId) {
            throw new ErrorHandler(
               412,
               412,
               "Unregistered federatd digital-twin"
            );
         }
         const {
            federated_digital_object_identifier,
            federated_digital_object_name,
            description,
            tags,
            access_url,
            access_protocol,
            creator_id,
            location,
            time_sync_cond,
            spatial_sync_cond,
            member_digital_twin_object_ids,
            data_model_id,
            preliminary_field,
         } = params;

         let federated_digital_object_id;
         if (federated_digital_object_identifier) {
            const isExistDOid = await model.postgres.checkIdExist({
               table: "federated_digital_objects",
               check: "federated_digital_object_id",
               id: federated_digital_object_identifier,
               federated_digital_twin_id,
            });
            if (isExistDOid) {
               throw new ErrorHandler(
                  412,
                  412,
                  "federated_digital_object_identifier already in use"
               );
            }
            federated_digital_object_id = federated_digital_object_identifier;
         } else {
            federated_digital_object_id = "FDO" + uuid();
         }

         // Fetch the federated digital twin data
         const selectDTsql = `select * from federated_digital_twins where federated_digital_twin_id = '${federated_digital_twin_id}'`;
         const selectedDTdata = await model.postgres.selectData({
            sql: selectDTsql,
         });
         const FDOcount =
            parseInt(selectedDTdata.number_of_federated_digital_objects) + 1;

         if (
            !config.setWindowDOtable.term.includes(time_sync_cond.time_interval)
         ) {
            throw new ErrorHandler(
               412,
               412,
               `time_interval Error: ${JSON.stringify(
                  time_sync_cond
               )} is not present in Window setting config`
            );
         }

         const promises = member_digital_twin_object_ids.map(async (id) => {
            const isExistID = await model.postgres.checkIdExist({
               table: "digital_objects",
               check: "digital_object_id",
               id,
            });
            if (!isExistID) {
               throw new ErrorHandler(
                  412,
                  412,
                  "Unregistered digital twin object"
               );
            }
         });

         await Promise.all(promises);

         const creationTime = lib.timestamp();
         const member_digital_twin_object_count =
            member_digital_twin_object_ids.length;
         let compose_sql = "";
         for (let i = 0; i < member_digital_twin_object_count; i++) {
            compose_sql += `INSERT INTO fdo_compositions (compose_id, federated_digital_twin_id, federated_digital_object_id, digital_object_id, rowtime, digital_object_count) VALUES ('CP${uuid()}', '${federated_digital_twin_id}', '${federated_digital_object_id}', '${
               member_digital_twin_object_ids[i]
            }', '${creationTime}', ${member_digital_twin_object_count});`;
         }

         const timeSyncInteger = time_sync_cond.time_interval;
         let spatialSyncWkt;
         try {
            spatialSyncWkt = spatial_sync_cond
               ? stringify(spatial_sync_cond)
               : "POLYGON EMPTY";
         } catch (error) {
            throw new ErrorHandler(
               412,
               412,
               "spatial_sync_cond requires a valid GeoJSON Feature or geometry object as input"
            );
         }

         const synComposeSQL = `INSERT INTO fdo_sync_compositions (compose_id, federated_digital_twin_id, federated_digital_object_id, time_sync, spatial_sync, rowtime) VALUES ('CP${uuid()}', '${federated_digital_twin_id}', '${federated_digital_object_id}', ${timeSyncInteger}, '${spatialSyncWkt}', '${creationTime}');`;
         const insert_sql = `INSERT INTO federated_digital_objects (
                           federated_digital_object_id,
                           federated_digital_twin_id,
                           federated_digital_object_name,
                           description,
                           tags,
                           access_url,
                           access_protocol,
                           creation_time,
                           creator_id,
                           modification_time,
                           location,
                           time_sync_cond,
                           spatial_sync_cond,
                           member_digital_twin_object_count,
                           member_digital_twin_object_ids,
                           data_model_id,
                           preliminary_field
                        ) VALUES ('${federated_digital_object_id}', '${federated_digital_twin_id}', '${federated_digital_object_name}', '${description}', '{${tags}}', '${access_url}', '${access_protocol}', '${creationTime}', '${creator_id}', '${creationTime}',
                          '${JSON.stringify(location)}', '${JSON.stringify(
            time_sync_cond
         )}', '${JSON.stringify(spatial_sync_cond)}',
                          ${member_digital_twin_object_count},'{${member_digital_twin_object_ids}}','${data_model_id}', 
                            '${JSON.stringify(preliminary_field)}');`;

         let insertRelationsSQL = "";
         insertRelationsSQL += await model.postgres.createinsertRelationSQL({
            parent_id: federated_digital_twin_id,
            resource_id: federated_digital_object_id,
            type: config.type.federatedDigitalObject,
         });
         insertRelationsSQL += await model.postgres.createinsertRelationSQL({
            parent_id: federated_digital_object_id,
            resource_id: member_digital_twin_object_ids,
            type: config.type.digitalObject,
         });
         insertRelationsSQL += await model.postgres.createinsertRelationSQL({
            parent_id: federated_digital_object_id,
            resource_id: data_model_id,
            type: config.type.dataModel,
         });
         await model.postgres.sendQuery({ sql: insertRelationsSQL });

         const updateFDOcountSQL = `update federated_digital_twins set number_of_federated_digital_objects = ${FDOcount}, modification_time = '${lib.timestamp()}' where federated_digital_twin_id = '${federated_digital_twin_id}';`;
         await model.postgres.sendQuery({
            sql:
               insert_sql +
               compose_sql +
               synComposeSQL +
               insertRelationsSQL +
               updateFDOcountSQL,
         });

         return { federated_digital_object_id };
      } catch (error) {
         console.log(error);
         throw new ErrorHandler(500, 412, error);
      }
   }

   /**
    * 저장된 federatedDigitalObjects 조회
    * @param {string} federated_digital_object_id
    * @returns {Json}
    */
   async Retrieve({ federated_digital_twin_id, federated_digital_object_id }) {
      const isExistID = await model.postgres.checkIdExist({
         table: "federated_digital_objects",
         check: "federated_digital_object_id",
         id: federated_digital_object_id,
         federated_digital_twin_id,
      });
      // federated-digitalObjects이 존재하면 조회
      if (isExistID) {
         const sql = `select * from federated_digital_objects where federated_digital_object_id = '${federated_digital_object_id}' and federated_digital_twin_id = '${federated_digital_twin_id}'`;
         const selectedData = await model.postgres.selectData({ sql });
         return selectedData;
      } else {
         throw new ErrorHandler(
            412,
            412,
            "Unregistered federated-digital-objects"
         );
      }
   }

   /**
    * 저장된 federated-digitalObjects 검색
    * @param {string} name
    * @returns {Json}
    */
   async Search({ federated_digital_twin_id, name }) {
      const isExistName = await model.postgres.checkNameExist({
         table: "federated_digital_objects",
         check: "federated_digital_object_name",
         name: name,
         federated_digital_twin_id,
      });

      if (isExistName) {
         const sql = `select * from federated_digital_objects where federated_digital_object_name = '${name}' and federated_digital_twin_id = '${federated_digital_twin_id}'`;
         const selectedData = await model.postgres.selectDataS({ sql });
         return selectedData;
      } else {
         throw new ErrorHandler(
            412,
            412,
            "Unregistered federated-digital-objects"
         );
      }
   }

   /**
    * @param {String} federated_digital_twin_id (required)
    * @param {String} federated_digital_object_id DO id(required)
    * @param {String} federated_digital_object_name DO name(required)
    * * @param {String} description (optional)
    * * @param {String} tags (required)
    * * @param {String} access_url (optional)
    * * @param {String} access_protocol (optional)
    * * @param {String} creator_time (required)
    * * @param {String} creator_id (required)
    * * @param {String} modification_time (required)
    * * @param {Json} location (system)
    * * @param {Json} time_sync_cond (optional)
    * * @param {Json} spatial_sync_cond (optional)
    * * @param {Number} member_digital_twin_object_count (required)
    * * @param {String} member_digital_twin_object_ids (required)
    * * @param {String} data_model_id (required)
    * * @param {Json} control
    * * @param {Json} data (optional)
    * @returns {Json} {}
    */

   async update({ federated_digital_twin_id, id }, params) {
      const isExistID = await model.postgres.checkIdExist({
         table: "federated_digital_objects",
         check: "federated_digital_object_id",
         id,
         federated_digital_twin_id,
      });

      // federated-digitalObjects이 존재하면 수정
      if (!isExistID) {
         throw new ErrorHandler(
            412,
            412,
            "Unregistered federated_digital_object"
         );
      } else {
         const whereClause = `where federated_digital_object_id = '${id}' and federated_digital_twin_id = '${federated_digital_twin_id}';`;
         let sql = `update federated_digital_objects set `;
         for (let key in params) {
            if (key === "member_digital_twin_object_ids") {
               //string array type
               for (let i in params[key]) {
                  let isExistID = await model.postgres.checkIdExist({
                     table: "digital_objects",
                     check: "digital_object_id",
                     id: params[key][i],
                  });
                  if (!isExistID) {
                     throw new ErrorHandler(
                        412,
                        412,
                        "Unregistered digital_twin object in FDO"
                     );
                  }
               }
               sql += `${key} = '{${lib.arryToEnum(
                  params[key]
               )}}',  member_digital_twin_object_count = ${
                  params[key].length
               }, `;
            } else if (key === "tags") {
               sql += `${key} = '{${params[key]}}', `;
            } else if (
               //json type
               key === "location" ||
               key === "spatial_sync_cond" ||
               key === "preliminary_field"
            ) {
               sql += `${key} = '${JSON.stringify(params[key])}', `;
            } else if (key === "time_sync_cond") {
               if (
                  !config.setWindowDOtable.term.includes(
                     params.time_sync_cond.time_interval
                  )
               ) {
                  throw new ErrorHandler(
                     412,
                     412,
                     `time_interval Error: ${JSON.stringify(
                        params.time_sync_cond
                     )} is not present in Window setting config`
                  );
               } else {
                  sql += `${key} = '${JSON.stringify(params[key])}', `;
               }
            } else {
               //string type
               sql += `${key} = '${params[key]}', `;
            }
         }
         sql += ` modification_time='${lib.timestamp()}' ${whereClause}`;
         await model.postgres.sendQuery({ sql });

         if (params.member_digital_twin_object_ids) {
            const deleteDOcomposeSQL = `delete from fdo_compositions ${whereClause}`;
            let compose_sql = "";
            for (
               let i = 0;
               i < params.member_digital_twin_object_ids.length;
               i++
            ) {
               compose_sql += `INSERT INTO fdo_compositions (compose_id, federated_digital_twin_id, federated_digital_object_id, digital_object_id, rowtime) VALUES ('CP${uuid()}', '${federated_digital_twin_id}', '${id}', '${
                  params.member_digital_twin_object_ids[i]
               }', '${lib.timestamp()}');`;
            }
            await model.postgres.sendQuery({
               sql: deleteDOcomposeSQL + compose_sql,
            });
         }

         let synComposeSQL = "";
         if (params.time_sync_cond && params.spatial_sync_cond) {
            // Both time_sync_cond and spatial_sync_cond exist
            const timeSyncInteger = params.time_sync_cond.time_interval;
            let spatialSyncWkt;
            try {
               spatialSyncWkt = params.spatial_sync_cond
                  ? stringify(params.spatial_sync_cond)
                  : "POLYGON EMPTY";
            } catch (error) {
               throw new ErrorHandler(
                  412,
                  412,
                  "spatial_sync_cond requires a valid GeoJSON Feature or geometry object as input"
               );
            }

            synComposeSQL = `update fdo_sync_compositions set time_sync=${timeSyncInteger}, spatial_sync='${spatialSyncWkt}' ${whereClause}`;
         } else if (params.time_sync_cond && !params.spatial_sync_cond) {
            // Only time_sync_cond exists
            const timeSyncInteger = params.time_sync_cond.time_interval;

            synComposeSQL = `update fdo_sync_compositions set time_sync=${timeSyncInteger} ${whereClause}`;
         } else if (!params.time_sync_cond && params.spatial_sync_cond) {
            // Only spatial_sync_cond exists
            let spatialSyncWkt;
            try {
               spatialSyncWkt = params.spatial_sync_cond
                  ? stringify(params.spatial_sync_cond)
                  : "POLYGON EMPTY";
            } catch (error) {
               throw new ErrorHandler(
                  412,
                  412,
                  "spatial_sync_cond requires a valid GeoJSON Feature or geometry object as input"
               );
            }
            synComposeSQL = `update fdo_sync_compositions set spatial_sync='${spatialSyncWkt}' ${whereClause}`;
         }

         return { update: id };
      }
   }

   /**
    * 저장된 DO 삭제
    * @param {string} name
    * @returns {Json}
    */
   async delete({ federated_digital_twin_id, id }) {
      const isExistID = await model.postgres.checkIdExist({
         table: "federated_digital_objects",
         check: "federated_digital_object_id",
         id,
         federated_digital_twin_id,
      });
      if (!isExistID) {
         throw new ErrorHandler(
            412,
            412,
            "Unregistered federated_digital_object"
         );
      } else {
         const selectFDTsql = `select * from federated_digital_twins where federated_digital_twin_id = '${federated_digital_twin_id}'`;
         const selectedFDTdata = await model.postgres.selectData({
            sql: selectFDTsql,
         });
         const FDOcount =
            parseInt(selectedFDTdata.number_of_federated_digital_objects) - 1;
         const updateFDOcountSQL = `update federated_digital_twins set number_of_federated_digital_objects = ${FDOcount}, modification_time = '${lib.timestamp()}' where federated_digital_twin_id = '${federated_digital_twin_id}';`;
         const deleteRelationSQL = `delete from relations where resource_id = '{${id}}' or parent_id = '${id}';`;
         const deleteObjectSQL = `delete from federated_digital_objects where federated_digital_object_id = '${id}' and federated_digital_twin_id = '${federated_digital_twin_id}'; delete from federated_digital_object_data where federated_digital_object_id= '${id}' and federated_digital_twin_id = '${federated_digital_twin_id}';`;
         const deleteFDOcomposeSQL = `delete from fdo_compositions where federated_digital_object_id = '${id}' and federated_digital_twin_id = '${federated_digital_twin_id}'; delete from fdo_sync_compositions where federated_digital_object_id = '${id}' and federated_digital_twin_id = '${federated_digital_twin_id}';`;

         await model.postgres.sendQuery({
            sql:
               updateFDOcountSQL +
               deleteRelationSQL +
               deleteObjectSQL +
               deleteFDOcomposeSQL,
         });

         return { delete: id };
      }
   }

   /**
    * federated_digital_object data 조회
    * @param {string} federated_digital_twin_id
    * @param {string} id digital_object_id
    * @param {string} from startDateTime
    * @param {string} to endDateTime
    * @returns {Json} 기간별 조회
    */
   async getData({ federated_digital_twin_id, id, from, to, count, window }) {
      const isExistID = await model.postgres.checkIdExist({
         table: "federated_digital_objects",
         check: "federated_digital_object_id",
         id,
         federated_digital_twin_id,
      });
      if (!isExistID) {
         throw new ErrorHandler(
            412,
            412,
            "Unregistered federated_digital_object"
         );
      }

      if (window) {
         if (!config.setWindowDOtable.term.includes(parseInt(window))) {
            throw new ErrorHandler(
               412,
               412,
               `time_interval Error: ${window} is not present in Window setting config`
            );
         }

         const baseSql = `SELECT * FROM federated_digital_object_window_data_${window} WHERE federated_digital_twin_id='${federated_digital_twin_id}' AND federated_digital_object_id = '${id}'`;

         if (from && to) {
            const sql = `${baseSql} AND rowtime >= '${from}'::timestamp AND rowtime <= '${to}'::timestamp;`;
            return await model.postgres.selectDataS({ sql });
         } else if (count) {
            const sql = `${baseSql} ORDER BY rowtime DESC LIMIT ${count};`;
            return await model.postgres.selectDataS({ sql });
         } else {
            const sql = `${baseSql} ORDER BY rowtime DESC LIMIT 100;`;
            return await model.postgres.selectDataS({ sql });
         }
      } else {
         const baseSql = `SELECT * FROM federated_digital_object_data WHERE federated_digital_twin_id='${federated_digital_twin_id}' AND federated_digital_object_id = '${id}'`;

         if (from && to) {
            const sql = `${baseSql} AND rowtime >= '${from}'::timestamp AND rowtime <= '${to}'::timestamp;`;
            return await model.postgres.selectDataS({ sql });
         } else if (count) {
            const sql = `${baseSql} ORDER BY rowtime DESC LIMIT ${count};`;
            return await model.postgres.selectDataS({ sql });
         } else {
            const sql = `${baseSql} ORDER BY rowtime DESC LIMIT 100;`;
            return await model.postgres.selectDataS({ sql });
         }
      }
   }

   /**
    * 저장된 모든 DO의 이름 조회
    * @returns {List}
    */
   async getAll({ federated_digital_twin_id }) {
      const sql = `select * from federated_digital_objects where federated_digital_twin_id = '${federated_digital_twin_id}';`;
      const FDOentireList = await model.postgres.selectDataS({ sql });

      return FDOentireList;
   }

   /*********************************************************************
    * federated Digital Object의 Controller 제어
    *
    * controller 데이터를 담은 data object 생성
    *  - FDO controller_id 리스트에 등록되어있는지 확인필요.
    *  - controller service module에 request passing
    *
    * @param {String} federated_digital_twin_id (required)
    * @param {String} federated_digital_object_name (required)
    * @param {Json Array} control_messages (required)
    *
    * @returns {Json} {}
    */
   async createControl(
      federated_digital_twin_id,
      federated_digital_object_id,
      params
   ) {
      const federated_digital_object_control_data_id = "FDOC" + uuid();
      const federated_digital_object_control_creation_time = lib.timestamp();
      const control_messages = params.commands;
      let returnMessage = {};

      if (!federated_digital_twin_id || !federated_digital_object_id) {
         throw new ErrorHandler(412, 5252, "please check mandatory field.");
      }

      if (!Array.isArray(control_messages) || control_messages.length == 0) {
         throw new ErrorHandler(412, 5252, "empty control message");
      }
      const isExistID = await model.postgres.checkIdExist({
         table: "federated_digital_objects",
         check: "federated_digital_object_id",
         id: federated_digital_object_id,
      });

      if (!isExistID) {
         throw new ErrorHandler(
            412,
            5252,
            "Unregistered federated_digital_object"
         );
      }

      const { member_digital_twin_object_ids } = await this.Retrieve({
         federated_digital_twin_id,
         federated_digital_object_id,
      });
      let messageByDt = {};
      // let executionResult = {};
      console.log("THIS IS CONTROLMESSAGE : ", control_messages);
      for (let message of control_messages) {
         /**
          * get FDO's DO 목록 불러와서 DO id 유효성 확인
          */
         let dtid = message.digital_twin_id;
         let doid = message.digital_object_id;
         // fdo에 do아이디가 있는지
         if (!member_digital_twin_object_ids.includes(doid)) {
            throw new ErrorHandler(
               412,
               5252,
               `'${doid}' is unregistered federated_digital_object with message '${message}'`
            );
         }
         /**
          * DT-DO 별로 컨트롤 메세지 구분
          */
         if (!messageByDt[dtid]) {
            messageByDt[dtid] = {};
         }
         if (!messageByDt[dtid][doid]) {
            messageByDt[dtid][doid] = [];
         }
         message.federated_digital_object_control_data_id =
            federated_digital_object_control_data_id;
         messageByDt[dtid][doid].push(message);
         // executionResult[doid] = "null";
      }
      /**
       * DT별 DO control 메세지 보내기
       * "POST /mirrorlake/v1/federated-twins/{federated_digital_twin_id}/digital-twins/{digital_twin_id}/digital-objects/{digital_object_id}/control}"
       */
      for (let dtid of Object.keys(messageByDt)) {
         for (let doid of Object.keys(messageByDt[dtid])) {
            let createControlData = await lib.request({
               url: `http://${config.federatedDigitalConnector.ip}:${config.federatedDigitalConnector.port}/${config.federatedDigitalConnector.base}/${federated_digital_twin_id}/digital-twins/${dtid}/digital-objects/${doid}/control`,
               bodyParams: { commands: messageByDt[dtid][doid] },
            });
            returnMessage[doid] = createControlData.data;
         }
      }

      const federated_digital_object_control_data_creator =
         control_messages[0].control_data_creator;
      const federated_digital_object_control_delivery_time = lib.timestamp();
      const federated_digital_object_control_delivery_result =
         JSON.stringify(returnMessage);
      const federated_digital_object_control_command =
         JSON.stringify(control_messages);
      const sql = `insert into federated_controls (federated_digital_object_control_data_id, federated_digital_object_id, federated_digital_object_control_data_creator, federated_digital_object_control_creation_time, federated_digital_object_control_delivery_time, federated_digital_object_control_delivery_result, federated_digital_object_control_command) values ('${federated_digital_object_control_data_id}', '${federated_digital_object_id}', '${federated_digital_object_control_data_creator}', '${federated_digital_object_control_creation_time}', '${federated_digital_object_control_delivery_time}', '${federated_digital_object_control_delivery_result}', '${federated_digital_object_control_command}');`;
      await model.postgres.sendQuery({ sql });
      /**
       * Execution result null로 세팅
       */
      let federated_digital_object_control_result_id = "";
      for (let dtid of Object.keys(messageByDt)) {
         for (let doid of Object.keys(messageByDt[dtid])) {
            // fdo execution result
            federated_digital_object_control_result_id = "FDOCR" + uuid();
            const fdo_sql = `insert into federated_control_result (federated_digital_object_control_result_id, federated_digital_object_control_data_id, federated_digital_object_control_execution_time, federated_digital_object_control_execution_result, digital_object_id) values ('${federated_digital_object_control_result_id}', '${federated_digital_object_control_data_id}', '${lib.timestamp()}', 'null', '${doid}');`;
            await model.postgres.sendQuery({ sql: fdo_sql });
         }
      }

      return { federated_digital_object_control_data_id };
   }

   /**
    * digital_object data 조회
    * @param {string} federated_digital_twin_id
    * @param {string} federated_digital_object_id
    * @param {string} from startDateTime
    * @param {string} to endDateTime
    * @returns {Json} 기간별 조회
    */
   async searchControl({
      federated_digital_twin_id,
      federated_digital_object_id,
      from,
      to,
      count,
   }) {
      if (!federated_digital_twin_id || !federated_digital_object_id) {
         throw new ErrorHandler(412, 5252, "please check mandatory field.");
      }
      let retrievedData = [];
      const isExistID = await model.postgres.checkIdExist({
         table: "federated_digital_objects",
         check: "federated_digital_object_id",
         id: federated_digital_object_id,
      });
      if (!isExistID) {
         throw new ErrorHandler(412, 5252, "Unregistered digital_object");
      }
      // Federated Digital Object Control Data ID 로 Group by 하고 그 결과들 모아서 JSON Array 로 전송
      let sql = `SELECT
      t1.federated_digital_object_control_data_id,
      t1.federated_digital_object_id,
      t1.digital_object_id,
      t1.federated_digital_object_control_creation_time,
      t2.federated_digital_object_control_result_id,
      t2.federated_digital_object_control_execution_time,
      t2.federated_digital_object_control_execution_result
      FROM
         (select federated_digital_object_control_data_id, federated_digital_object_control_creation_time, federated_digital_object_id, jsonb_array_elements(c.federated_digital_object_control_command):: jsonb ->> 'digital_object_id' as digital_object_id 
         from federated_controls c) as t1
      LEFT JOIN
      (SELECT DISTINCT ON (federated_digital_object_control_data_id, digital_object_id) *
         FROM federated_control_result
         ORDER BY federated_digital_object_control_data_id, digital_object_id, federated_digital_object_control_execution_time DESC) as t2 
    ON t1.federated_digital_object_control_data_id = t2.federated_digital_object_control_data_id AND t1.digital_object_id = t2.digital_object_id`;

      if (from && to) {
         sql += ` WHERE federated_digital_object_control_creation_time >= '${from}'::timestamp AND federated_digital_object_control_creation_time <= '${to}'::timestamp`;
      } else if (from) {
         sql += ` WHERE federated_digital_object_control_creation_time >= '${from}'::timestamp`;
      } else if (to) {
         sql += ` WHERE federated_digital_object_control_creation_time <= '${to}'::timestamp`;
      }
      sql += ` ORDER BY federated_digital_object_control_creation_time DESC;`;
      retrievedData = await model.postgres.selectDataS({ sql });
      console.log(retrievedData);

      // Retrieved Data -->> 같은 control_data_id끼리 json으로 묶어서 return
      /**
       * { control_data_id : {time:, fdo_id:, result: {doid:{result id, time, result}, doid:{result id, time, result}, doid:null}},
       *   control_data_id : {time:, fdo_id:, result: {doid:{result id, time, result}, doid:{result id, time, result}, doid:null}}, }
       */
      let returnData = {};
      let returnDataCount = 0;
      if (retrievedData.length != 0) {
         for (let data of retrievedData) {
            let doData = {
               control_execution_result_id:
                  data.federated_digital_object_control_result_id,
               control_execution_time:
                  data.federated_digital_object_control_execution_time,
               control_execution_result:
                  data.federated_digital_object_control_execution_result,
            };
            let doID = data.digital_object_id;
            if (returnData[data.federated_digital_object_control_data_id]) {
               returnData[data.federated_digital_object_control_data_id][
                  "federated_digital_object_control_execution_result"
               ][doID] = doData;
            } else {
               if (count && count <= returnDataCount) {
                  break;
               }
               returnDataCount++;
               returnData[data.federated_digital_object_control_data_id] = {};
               returnData[data.federated_digital_object_control_data_id][
                  "federated_digital_object_control_creation_time"
               ] = data.federated_digital_object_control_creation_time;
               returnData[data.federated_digital_object_control_data_id][
                  "federated_digital_object_id"
               ] = data.federated_digital_object_id;
               returnData[data.federated_digital_object_control_data_id][
                  "federated_digital_object_control_execution_result"
               ] = {};
               returnData[data.federated_digital_object_control_data_id][
                  "federated_digital_object_control_execution_result"
               ][doID] = doData;
            }
         }
      }
      return returnData;
   }

   /**
    * federated_digital_object contorl data 조회 - id 조회
    * @param {string} federated_digital_twin_id
    * @param {string} federated_digital_object_id
    * @param {string} federated_digital_object_control_data_id
    * @returns {Json}
    */
   async retrieveControl({
      federated_digital_twin_id,
      federated_digital_object_id,
      federated_digital_object_control_data_id,
   }) {
      if (
         !federated_digital_twin_id ||
         !federated_digital_object_id ||
         !federated_digital_object_control_data_id
      ) {
         throw new ErrorHandler(412, 5252, "please check mandatory field.");
      }
      const isExistID = await model.postgres.checkIdExist({
         table: "federated_control_result",
         check: "federated_digital_object_control_data_id",
         id: federated_digital_object_control_data_id,
      });
      if (!isExistID) {
         throw new ErrorHandler(
            412,
            5252,
            "Unregistered federated_digital_object control data"
         );
      }

      // let sql = `select * from federated_control_result where federated_digital_object_control_data_id = ${federated_digital_object_control_data_id} `;
      let sql = `SELECT
      t1.federated_digital_object_control_data_id,
      t1.federated_digital_object_id,
      t1.digital_object_id,
      t1.federated_digital_object_control_creation_time,
      t2.federated_digital_object_control_result_id,
      t2.federated_digital_object_control_execution_time,
      t2.federated_digital_object_control_execution_result
      FROM
         (select federated_digital_object_control_data_id, federated_digital_object_control_creation_time, federated_digital_object_id, jsonb_array_elements(c.federated_digital_object_control_command):: jsonb ->> 'digital_object_id' as digital_object_id 
         from federated_controls c) as t1
      LEFT JOIN
      (SELECT DISTINCT ON (federated_digital_object_control_data_id, digital_object_id) *
         FROM federated_control_result
         ORDER BY federated_digital_object_control_data_id, digital_object_id, federated_digital_object_control_execution_time DESC) as t2 
    ON t1.federated_digital_object_control_data_id = t2.federated_digital_object_control_data_id AND t1.digital_object_id = t2.digital_object_id`;

      const retrievedData = await model.postgres.selectDataS({ sql });

      let returnData = {};
      if (retrievedData.length != 0) {
         for (let data of retrievedData) {
            let doData = {
               control_execution_result_id:
                  data.federated_digital_object_control_result_id,
               control_execution_time:
                  data.federated_digital_object_control_execution_time,
               control_execution_result:
                  data.federated_digital_object_control_execution_result,
            };
            let doID = data.digital_object_id;
            if (returnData[data.federated_digital_object_control_data_id]) {
               returnData[data.federated_digital_object_control_data_id][
                  "federated_digital_object_control_execution_result"
               ][doID] = doData;
            } else {
               returnData[data.federated_digital_object_control_data_id] = {};
               returnData[data.federated_digital_object_control_data_id][
                  "federated_digital_object_control_creation_time"
               ] = data.federated_digital_object_control_creation_time;
               returnData[data.federated_digital_object_control_data_id][
                  "federated_digital_object_id"
               ] = data.federated_digital_object_id;
               returnData[data.federated_digital_object_control_data_id][
                  "federated_digital_object_control_execution_result"
               ] = {};
               returnData[data.federated_digital_object_control_data_id][
                  "federated_digital_object_control_execution_result"
               ][doID] = doData;
            }
         }
      }
      return returnData;
   }
}
module.exports = FederatedDigitalObjects;
