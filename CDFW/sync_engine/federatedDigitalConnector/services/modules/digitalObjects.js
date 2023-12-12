const ErrorHandler = require("../../lib/error-handler");
const lib = require("../../lib/index");
const config = require("../../config");
const Model = require("../../models");
const model = new Model();

class DigitalObjects {
   /**
    * @param {String} digital_twin_id (required)
    * @param {String} digital_object_name (required)
    * @param {String} description (optional)
    * @param {String array} tags (required)
    * @param {String array} subject (required)
    * @param {String} creation_time (required)
    * @param {String} modification_time (required)
    * @param {String} digital_object_data_access_type (required) ex : http
    * @param {String} digital_object_data_access_url (required)
    * @param {String} digital_object_control_url (required)
    * @param {String} digital_object_data_model (required)
    * @param {String} digital_object_data_interval (required)
    * @param {String} digital_object_control_request_model (required)
    * @param {Json} do_metadata (required)
    * @param {Json} preliminary_field (required)
    *
    * @returns {Json} {}
    */
   async create(federated_twin_id, digital_twin_id, params) {
      try {
         // Check if the federated_digital twin ID exists
         // FDT가 있고 DT가 등록이 되어 있고 등록된 DT 안에 DO를 등록해야 됨
         const isExistFDtId = await model.postgres.checkIdExist({
            table: "federated_digital_twins",
            check: "federated_digital_twin_id",
            id: federated_twin_id,
         });

         const isExistDtId = await model.postgres.checkIdExist({
            table: "digital_twins",
            check: "digital_twin_id",
            id: digital_twin_id,
         });

         if (!isExistDtId && !isExistFDtId) {
            throw new ErrorHandler(
               412,
               5252,
               "Unregistered digital-twin or federated_digital_twin"
            );
         }

         // Fetch the digital twin data
         // and 연산 : 서로 다른 FDT에 서로 다른 센서를 등록할 수 있음
         const selectDTsql = `select * from digital_twins where federated_digital_twin_id = '${federated_twin_id}' and digital_twin_id = '${digital_twin_id}';`;
         const selectedDTdata = await model.postgres.selectData({
            sql: selectDTsql,
         });
         let DOcount = 0;
         if (selectedDTdata.number_of_digital_objects) {
            DOcount = parseInt(selectedDTdata.number_of_digital_objects) + 1;
         }

         const {
            digital_object_name,
            description,
            tags,
            subject,
            creation_time,
            modification_time,
            digital_object_data_access_type,
            digital_object_data_access_url,
            digital_object_control_url,
            digital_object_data_model,
            digital_object_data_interval,
            digital_object_control_request_model,
            do_metadata,
            preliminary_field,
         } = params;
         const digital_object_id = "D" + uuid();
         const sql = `INSERT INTO digital_objects (
                           digital_twin_id,
                           digital_object_id,
                           digital_object_name,
                           description,
                           tags,
                           subject,
                           creation_time,
                           modification_time,
                           digital_object_data_access_type,
                           digital_object_data_access_url,
                           digital_object_control_url,
                           digital_object_data_model,
                           digital_object_data_interval,
                           digital_object_control_request_model,
                           do_metadata,
                           preliminary_field
                        ) VALUES ('${digital_twin_id}','${digital_object_id}', '${digital_object_name}', '${description}', '{${tags}}', '{${subject}}', '${creation_time}', '${modification_time}', '${digital_object_data_access_type}', '${digital_object_data_access_url}','${digital_object_control_url}', '${JSON.stringify(
            digital_object_data_model
         )}', ${digital_object_data_interval}, '${JSON.stringify(
            digital_object_control_request_model
         )}', '${JSON.stringify(do_metadata)}', '${JSON.stringify(
            preliminary_field
         )}');`;

         await model.postgres.sendQuery({ sql });

         // let insertRelationsSQL = "";
         // insertRelationsSQL += await model.postgres.createinsertRelationSQL({
         //    parent_id: digital_twin_id,
         //    resource_id: digital_object_id,
         //    type: config.type.digitalObject,
         // });
         // insertRelationsSQL += await model.postgres.createinsertRelationSQL({
         //    parent_id: digital_object_id,
         //    resource_id: member_sensor_ids,
         //    type: config.type.sensor,
         // });
         // insertRelationsSQL += await model.postgres.createinsertRelationSQL({
         //    parent_id: digital_object_id,
         //    resource_id: member_controller_ids,
         //    type: config.type.controller,
         // });
         // insertRelationsSQL += await model.postgres.createinsertRelationSQL({
         //    parent_id: digital_object_id,
         //    resource_id: member_visual_model_id,
         //    type: config.type.visualModel,
         // });
         // insertRelationsSQL += await model.postgres.createinsertRelationSQL({
         //    parent_id: digital_object_id,
         //    resource_id: member_data_model_id,
         //    type: config.type.dataModel,
         // });
         // insertRelationsSQL += await model.postgres.createinsertRelationSQL({
         //    parent_id: digital_object_id,
         //    resource_id: member_behavior_model_id,
         //    type: config.type.behaviorModel,
         // });
         const updateDOcountSQL = `update digital_twins set number_of_digital_objects = ${DOcount}, modification_time = '${lib.timestamp()}' where digital_twin_id = '${digital_twin_id}';`;

         await model.postgres.sendQuery({
            sql: updateDOcountSQL,
         });

         return { digital_object_id };
      } catch (error) {
         throw new ErrorHandler(500, 5252, error);
      }
   }

   /**
    * 저장된 digitalObjects 조회
    * @param {string} digital_object_id
    * @returns {Json}
    */
   async Retrieve({ digital_twin_id, digital_object_id }) {
      const isExistID = await model.postgres.checkIdExist({
         table: "digital_objects",
         check: "digital_object_id",
         id: digital_object_id,
         digital_twin_id,
      });
      // digitalObjects이 존재하면 조회
      if (isExistID) {
         const sql = `select * from digital_objects where digital_object_id = '${digital_object_id}' and digital_twin_id = '${digital_twin_id}'`;
         const selectedData = await model.postgres.selectData({ sql });
         return selectedData;
      } else {
         throw new ErrorHandler(412, 5252, "Unregistered digital-objects");
      }
   }

   /**
    * 저장된 digitalObjects 검색
    * @param {string} name
    * @returns {Json}
    */
   async Search({ digital_twin_id, name }) {
      const isExistName = await model.postgres.checkNameExist({
         table: "digital_objects",
         check: "digital_object_name",
         name: name,
         digital_twin_id,
      });

      if (isExistName) {
         const sql = `select * from digital_objects where digital_object_name = '${name}' and digital_twin_id = '${digital_twin_id}'`;
         const selectedData = await model.postgres.selectDataS({ sql });
         return selectedData;
      } else {
         throw new ErrorHandler(412, 5252, "Unregistered digital-objects");
      }
   }

   /**
    * 저장된 DO 수정
    * @param {String} digital_twin_id (required)
    * @param {String} id DO id(required)
    * @param {String} params body request(required)
    * * @param {String} digital_object_name (required)
    * * @param {String} description (optional)
    * * @param {String} tags (required)
    * * @param {String} access_url (optional)
    * * @param {String} access_protocol (optional)
    * * @param {String} creator_id (required)
    * * @param {Json} location (system)
    * * @param {Json} time_sync_cond (optional)
    * * @param {Json} spatial_sync_cond (optional)
    * * @param {String array} member_sensor_ids (required)
    * * @param {String array} member_controller_ids (required)
    * * @param {String} member_data_model_id (required)
    * * @param {String} member_visual_model_id (required)
    * * @param {String} member_behavior_model_id (required)
    * @returns {Json} {}
    */

   async update({ digital_twin_id, id }, params) {
      const isExistID = await model.postgres.checkIdExist({
         table: "digital_objects",
         check: "digital_object_id",
         id,
         digital_twin_id,
      });

      // digitalObjects이 존재하면 수정
      if (!isExistID) {
         throw new ErrorHandler(412, 5252, "Unregistered digital_object");
      } else {
         let sql = `update digital_objects set `;
         for (let key in params) {
            if (key === "tags" || key === "subject") {
               sql += `${key} = '{${params[key]}}', `;
            } else if (
               //json type
               key === "digital_object_data_model" ||
               key === "digital_object_control_request_model" ||
               key === "do_metadata" ||
               key === "preliminary_field"
            ) {
               sql += `${key} = '${JSON.stringify(params[key])}', `;
            } else if (
               //integer type
               key === "digital_object_data_interval"
            ) {
               sql += `${key} = ${params[key]}, `;
            } else {
               //string type
               sql += `${key} = '${params[key]}', `;
            }
         }
         sql += ` modification_time='${lib.timestamp()}' where digital_object_id = '${id}' and digital_twin_id = '${digital_twin_id}'`;
         await model.postgres.sendQuery({ sql });

         return { update: id };
      }
   }

   /**
    * 저장된 DO 삭제
    * @param {string} name
    * @returns {Json}
    */
   async delete({ digital_twin_id, id }) {
      const isExistID = await model.postgres.checkIdExist({
         table: "digital_objects",
         check: "digital_object_id",
         id,
         digital_twin_id,
      });
      if (!isExistID) {
         throw new ErrorHandler(412, 5252, "Unregistered digital_object");
      } else {
         const selectDTsql = `select * from digital_twins where digital_twin_id = '${digital_twin_id}'`;
         const selectedDTdata = await model.postgres.selectData({
            sql: selectDTsql,
         });
         const DOcount = parseInt(selectedDTdata.number_of_digital_objects) - 1;
         const updateDOcountSQL = `update digital_twins set number_of_digital_objects = ${DOcount}, modification_time = '${lib.timestamp()}' where digital_twin_id = '${digital_twin_id}';`;
         const deleteSQL = `delete from digital_objects where digital_object_id = '${id}'; delete from digital_object_data where digital_object_id = '${id}';`;
         await model.postgres.sendQuery({ sql: updateDOcountSQL + deleteSQL });
         // const sql = `delete from relations where resource_id = '{${id}}' or parent_id = '${id}'; UPDATE name_list set list=array_remove(list, '${id}') where type='digital_object' and digital_twin_id='${digital_twin_id}';`
         // await model.postgres.sendQuery({ sql });

         return { delete: id };
      }
   }

   /**
    * DO data 생성
    * @returns {}
    */
   async createDigitalObjectData(
      { federated_twin_id, digital_twin_id, digital_object_id },
      body
   ) {
      const isExistID = await model.postgres.checkIdExist({
         table: "digital_objects",
         check: "digital_object_id",
         id: digital_object_id,
         digital_twin_id,
      });
      if (!isExistID) {
         throw new ErrorHandler(412, 5252, "Unregistered digital_object");
      }
      const rowtime = lib.timestamp();

      const valueObjectMessage = {
         federated_digital_twin_id: federated_twin_id,
         digital_twin_id,
         digital_object_id,
         data: JSON.stringify(body.data),
         rowtime,
         location: JSON.stringify(body.location),
      };

      const kafkaKey = { digital_object_id };
      model.kafka.kafkaProducer({
         topic: "UnalliedDigitalObject",
         kafkaKey: JSON.stringify(kafkaKey),
         data: JSON.stringify(valueObjectMessage),
      }); //string

      return 0;
   }

   /**
    * digital_object data 조회
    * example)
    * url = http://{{ip}}:1209/mirrorlake/v1/D46d8c5717a08988190a816a71edff08e/digital_objects/S449fd692f225c086862abc729030aeb8/data?from=2023-03-12T23:32:01.232&to=2023-04-12T06:48:45.232
    * set time sql = SELECT * FROM digital_object_data WHERE digital_twin_id='D46d8c5717a08988190a816a71edff08e' AND digital_object_id = 'S449fd692f225c086862abc729030aeb8' AND rowtime >= '2023-03-12T23:32:01.232'::timestamp AND rowtime <= '2023-04-12T06:48:45.232'::timestamp;
    * default sql = SELECT * FROM digital_object_data WHERE digital_twin_id='D46d8c5717a08988190a816a71edff08e' AND digital_object_id = 'S449fd692f225c086862abc729030aeb8' order by rowtime desc limit 100;
    * @param {string} digital_twin_id
    * @param {string} id digital_object_id
    * @param {string} from startDateTime
    * @param {string} to endDateTime
    * @returns {Json} 기간별 조회
    */
   async getData({ federated_twin_id, digital_twin_id, id, from, to, count }) {
      const isExistID = await model.postgres.checkIdExist({
         table: "digital_objects",
         check: "digital_object_id",
         id,
         digital_twin_id,
      });
      if (!isExistID) {
         throw new ErrorHandler(412, 5252, "Unregistered digital_object");
      }

      if (from && to) {
         const sql = `SELECT * FROM digital_object_data WHERE digital_twin_id='${digital_twin_id}' AND digital_object_id = '${id}' AND rowtime >= '${from}'::timestamp AND rowtime <= '${to}'::timestamp;`;
         const retrievedData = await model.postgres.selectDataS({ sql });
         return retrievedData;
      } else if (count) {
         const sql = `SELECT * FROM digital_object_data WHERE digital_twin_id='${digital_twin_id}' AND digital_object_id = '${id}' order by rowtime desc limit ${count};`;
         const retrievedData = await model.postgres.selectDataS({ sql });
         return retrievedData;
      } else {
         const sql = `SELECT * FROM digital_object_data WHERE digital_twin_id='${digital_twin_id}' AND digital_object_id = '${id}' order by rowtime desc limit 100;`;
         const retrievedData = await model.postgres.selectDataS({ sql });
         return retrievedData;
      }
   }

   /**
    * 저장된 모든 DO의 이름 조회
    * @returns {List}
    */
   async getAll({ digital_twin_id }) {
      const sql = `select * from digital_objects where digital_twin_id = '${digital_twin_id}';`;
      const DOentireList = await model.postgres.selectDataS({ sql });

      return DOentireList;
   }

   /**
    * 저장된 모든 DO 삭제
    * @returns {}
    */
   async deleteAll({ digital_twin_id }) {
      const sql = `delete from digital_objects where 'digital_twin_id' = '${digital_twin_id}'; delete from digital_object_data where 'digital_twin_id' = '${digital_twin_id}'; delete from name_list where type='digital_object' and digital_twin_id = '${digital_twin_id}'`;
      const DOentireDelete = await model.postgres.sendQuery({ sql });

      return DOentireDelete;
   }

   /*********************************************************************
    * Digital Object의 Controller 제어
    *
    * controller 데이터를 담은 data object 생성
    *  - DO controller_id 리스트에 등록되어있는지 확인필요.
    *  - controller service module에 request passing
    *
    * @param {String} digital_twin_id (required)
    * @param {String} digital_object_name (required)
    * @param {Json Array} control_messages (required)
    *
    * @returns {Json} {}
    */
   async createControl(digital_twin_id, digital_object_id, params) {
      const control_messages = params;
      let returnMessage = [];

      if (!digital_twin_id || !digital_object_id || !control_messages) {
         throw new ErrorHandler(412, 5252, "please check mandatory field.");
      }

      if (!Array.isArray(control_messages) || control_messages.length == 0) {
         throw new ErrorHandler(412, 5252, "empty control message");
      }

      /**
       * get DO's controller id list
       */
      let { controller_id } = await this.Retrieve({
         digital_twin_id,
         digital_object_id,
      });
      let DO_controller_id = controller_id;
      if (DO_controller_id == null || DO_controller_id == undefined) {
         throw new ErrorHandler(
            412,
            5252,
            "Controllers are not registered with Digital Object."
         );
      }
      if (!Array.isArray(DO_controller_id) || DO_controller_id.length == 0) {
         throw new ErrorHandler(
            412,
            5252,
            "Controllers are not registered with Digital Object."
         );
      }

      /**
       * control message 처리
       */
      // controller가 존재하는지, DO controller list에 포함되어 있는지 확인
      control_messages.forEach(async (element) => {
         let isExistID = await model.postgres.checkIdExist({
            table: "controllers",
            check: "controller_id",
            id: element.controller_id,
         });

         let isIncludeID = DO_controller_id.includes(element.controller_id);

         if (!isExistID) {
            throw new ErrorHandler(
               412,
               5252,
               `Unregistered controller : ${element.controller_id}`
            );
         }
         if (!isIncludeID) {
            throw new ErrorHandler(
               412,
               5252,
               `${element.controller_id} controller is not registered with Digital Object(${digital_object_id}).`
            );
         }
      });

      // 유효성 검사 마치고 한 번에 전송
      control_messages.forEach(async (element) => {
         try {
            let createControlData = await lib.request({
               url: `http://${config.federatedDigitalConnector.ip}:${config.federatedDigitalConnector.port}/${config.federatedDigitalConnector.base}/${digital_twin_id}/controllers/${element.controller_id}/data`,
               bodyParams: {
                  control_data_creator: element.control_data_creator,
                  control_command: element.control_command,
               },
            });
            returnMessage.push(createControlData.control_data_id);
         } catch (e) {
            throw new ErrorHandler(
               412,
               5252,
               `create control data error \n ${e}`
            );
         }
      });
      return { control_data_id: returnMessage };
   }

   /**
    * digital_object data 조회
    * @param {string} digital_twin_id
    * @param {string} id digital_object_id
    * @param {string} from startDateTime
    * @param {string} to endDateTime
    * @returns {Json} 기간별 조회
    */
   async retrieveControl({ digital_twin_id, digital_object_id }) {
      if (!digital_twin_id || !digital_object_id) {
         throw new ErrorHandler(412, 5252, "please check mandatory field.");
      }
      const isExistID = await model.postgres.checkIdExist({
         table: "digital_objects",
         check: "digital_object_id",
         digital_object_id,
      });
      if (!isExistID) {
         throw new ErrorHandler(412, 5252, "Unregistered digital_object");
      }

      // Get Digital Object's Controller list
      let { controller_id } = await this.Retrieve({
         digital_twin_id,
         digital_object_id,
      });
      controller_id = controller_id.replace(/[\[\]]/gi, "");
      let controller_id_list = controller_id.split(",");
      if (
         !Array.isArray(controller_id_list) ||
         controller_id_list.length == 0
      ) {
         return {};
      }

      // Get Controller's joined data
      let sql = `select * from control_data where controller_id in ( `;
      controller_id_list.forEach((element, index) => {
         if (index != 0) sql += `, `;
         sql += `'${element}'`;
      });
      sql += `);`;

      const retrievedData = await model.postgres.selectDataS({ sql });
      return retrievedData;
   }
}

module.exports = DigitalObjects;
