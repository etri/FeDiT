const ErrorHandler = require("../../lib/error-handler");
const lib = require("../../lib/index");
const config = require("../../config");
const Model = require("../../models");
const model = new Model();
const { stringify } = require("wkt");

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
    * @param {String} digital_object_data_source_type
    * @param {String} digital_object_data_source_url
    * @param {String} digital_object_control_url (required)
    * @param {String} digital_object_data_model (required)
    * @param {String} digital_object_data_interval (required)
    * @param {String} digital_object_control_request_model (required)
    * @param {Json} do_metadata (required)
    * @param {Json} preliminary_field (required)
    *
    * @returns {Json} {}
    */
   async create(federated_digital_twin_id, digital_twin_id, params) {
      try {
         // Check if the federated_digital twin ID exists
         // FDT가 있고 DT가 등록이 되어 있고 등록된 DT 안에 DO를 등록해야 됨
         const isExistFDtId = await model.postgres.checkIdExist({
            table: "federated_digital_twins",
            check: "federated_digital_twin_id",
            id: federated_digital_twin_id,
         });

         const isExistDtId = await model.postgres.checkIdExist({
            table: "digital_twins",
            check: "digital_twin_id",
            id: digital_twin_id,
         });

         if (!isExistDtId && !isExistFDtId) {
            throw new ErrorHandler(
               412,
               412,
               "Unregistered digital-twin or federated_digital_twin"
            );
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
            digital_object_data_source_type,
            digital_object_data_source_url,
            digital_object_control_url,
            digital_object_data_model,
            digital_object_data_interval,
            digital_object_control_request_model,
            do_metadata,
            preliminary_field,
         } = params;
         const digital_object_id = "D" + uuid();
         const sql = `INSERT INTO digital_objects (
                           federated_digital_twin_id,
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
                           digital_object_data_source_type,
                           digital_object_data_source_url,
                           digital_object_control_url,
                           digital_object_data_model,
                           digital_object_data_interval,
                           digital_object_control_request_model,
                           do_metadata,
                           preliminary_field
                           ) VALUES ('${federated_digital_twin_id}', '${digital_twin_id}', '${digital_object_id}', '${digital_object_name}', '${description}', '{${tags}}', '{${subject}}', '${creation_time}', '${modification_time}', '${digital_object_data_access_type}', '${digital_object_data_source_type}', '${digital_object_data_source_url}', '${digital_object_data_access_url}','${digital_object_control_url}', '${JSON.stringify(
            digital_object_data_model
         )}', ${digital_object_data_interval}, '${JSON.stringify(
            digital_object_control_request_model
         )}', '${JSON.stringify(do_metadata)}', '${JSON.stringify(
            preliminary_field
         )}');`;

         await model.postgres.sendQuery({ sql });
         if (digital_object_data_source_type === "POLL") {
            if (!digital_object_data_source_url) {
               throw new ErrorHandler(
                  412,
                  412,
                  "When the digital_object_data_source_type is set to POLL the digital_object_data_source_url is required"
               );
            } else {
               const protocol = digital_object_data_source_url.split(":");
               if (protocol[0] == "http") {
                  await model.kafka.createSourceHttpConnector({
                     id: digital_object_id,
                     url: digital_object_data_source_url,
                     digital_twin_id,
                     federated_digital_twin_id,
                     digital_object_data_interval,
                  });
               }
            }
         }
         return { digital_object_id };
      } catch (error) {
         throw new ErrorHandler(500, 412, error);
      }
   }

   /**
    * 저장된 digitalObjects 조회
    * @param {string} digital_object_id
    * @returns {Json}
    */
   async Retrieve({
      federated_digital_twin_id,
      digital_twin_id,
      digital_object_id,
   }) {
      const isExistID = await model.postgres.checkIdExist({
         table: "digital_objects",
         check: "digital_object_id",
         id: digital_object_id,
         digital_twin_id,
         federated_digital_twin_id,
      });
      // digitalObjects이 존재하면 조회
      if (isExistID) {
         const sql = `select * from digital_objects where federated_digital_twin_id = '${federated_digital_twin_id}' and digital_object_id = '${digital_object_id}' and digital_twin_id = '${digital_twin_id}'`;
         const selectedData = await model.postgres.selectData({ sql });
         return selectedData;
      } else {
         throw new ErrorHandler(412, 412, "Unregistered digital-objects");
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
         federated_digital_twin_id,
      });

      if (isExistName) {
         const sql = `select * from digital_objects where digital_object_name = '${name}' and digital_twin_id = '${digital_twin_id}'`;
         const selectedData = await model.postgres.selectDataS({ sql });
         return selectedData;
      } else {
         throw new ErrorHandler(412, 412, "Unregistered digital-objects");
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

   async update({ federated_digital_twin_id, digital_twin_id, id }, params) {
      const isExistID = await model.postgres.checkIdExist({
         table: "digital_objects",
         check: "digital_object_id",
         id,
         digital_twin_id,
         federated_digital_twin_id,
      });

      // digitalObjects이 존재하면 수정
      if (!isExistID) {
         throw new ErrorHandler(412, 412, "Unregistered digital_object");
      } else {
         let sql = `update digital_objects set `;
         let hasSetClause = false;
         for (let key in params) {
            if (key === "tags" || key === "subject") {
               sql += `${hasSetClause ? ", " : ""}${key} = '{${params[key]}}'`;
            } else if (
               // json type
               key === "digital_object_data_model" ||
               key === "digital_object_control_request_model" ||
               key === "do_metadata" ||
               key === "preliminary_field"
            ) {
               sql += `${hasSetClause ? ", " : ""}${key} = '${JSON.stringify(
                  params[key]
               )}'`;
            } else if (
               // integer type
               key === "digital_object_data_interval"
            ) {
               sql += `${hasSetClause ? ", " : ""}${key} = ${params[key]}`;
            } else {
               // string type
               sql += `${hasSetClause ? ", " : ""}${key} = '${params[key]}'`;
            }

            hasSetClause = true;
         }

         sql += ` where digital_object_id = '${id}' and digital_twin_id = '${digital_twin_id}'`;
         await model.postgres.sendQuery({ sql });

         return { update: id };
      }
   }

   /**
    * 저장된 DO 삭제
    * @param {string} name
    * @returns {Json}
    */
   async delete({ federated_digital_twin_id, digital_twin_id, id }) {
      const isExistID = await model.postgres.checkIdExist({
         table: "digital_objects",
         check: "digital_object_id",
         id,
         digital_twin_id,
         federated_digital_twin_id,
      });
      if (!isExistID) {
         throw new ErrorHandler(412, 412, "Unregistered digital_object");
      } else {
         const deleteSQL = `delete from digital_objects where digital_object_id = '${id}' and federated_digital_twin_id = '${federated_digital_twin_id}'; delete from digital_object_data where digital_object_id = '${id}' and federated_digital_twin_id = '${federated_digital_twin_id}';`;
         const sql = `select * from digital_objects where federated_digital_twin_id = '${federated_digital_twin_id}' and digital_object_id = '${id}' and digital_twin_id = '${digital_twin_id}'`;
         const selectedData = await model.postgres.selectData({ sql });
         await model.postgres.sendQuery({ sql: deleteSQL });
         console.log("delete: ", selectedData);
         if (selectedData.digital_object_data_source_type == "POLL") {
            await model.kafka.deleteSink({ id: `HttpSource${id}` });
         }

         return { delete: id };
      }
   }

   /**
    * DO data 생성
    * @returns {}
    */
   async createDigitalObjectData(
      { federated_digital_twin_id, digital_twin_id, digital_object_id },
      body
   ) {
      const isExistID = await model.postgres.checkIdExist({
         table: "digital_objects",
         check: "digital_object_id",
         id: digital_object_id,
         digital_twin_id,
         federated_digital_twin_id,
      });
      if (!isExistID) {
         throw new ErrorHandler(412, 412, "Unregistered digital_object");
      }
      const rowtime = lib.timestamp();
      let geojsonToWkt;
      try {
         geojsonToWkt = body.location
            ? stringify(body.location)
            : "POINT EMPTY";
      } catch (error) {
         throw new ErrorHandler(
            412,
            412,
            "location requires a valid GeoJSON Feature or geometry object as input"
         );
      }
      const valueObjectMessage = {
         federated_digital_twin_id,
         digital_twin_id,
         digital_object_id,
         data: JSON.stringify(body.data),
         rowtime,
         location: geojsonToWkt,
      };

      const kafkaKey = { digital_object_id };
      model.kafka.kafkaProducer({
         topic: "UnalliedDigitalObjects",
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
   async getData({
      federated_digital_twin_id,
      digital_twin_id,
      id,
      from,
      to,
      count,
   }) {
      const isExistID = await model.postgres.checkIdExist({
         table: "digital_objects",
         check: "digital_object_id",
         id,
         digital_twin_id,
         federated_digital_twin_id,
      });
      if (!isExistID) {
         throw new ErrorHandler(412, 412, "Unregistered digital_object");
      }

      if (from && to) {
         const sql = `SELECT * FROM digital_object_data WHERE federated_digital_twin_id='${federated_digital_twin_id}' AND digital_twin_id='${digital_twin_id}' AND digital_object_id = '${id}' AND rowtime >= '${from}'::timestamp AND rowtime <= '${to}'::timestamp;`;
         const retrievedData = await model.postgres.selectDataS({ sql });
         return retrievedData;
      } else if (count) {
         const sql = `SELECT * FROM digital_object_data WHERE federated_digital_twin_id='${federated_digital_twin_id}' AND digital_twin_id='${digital_twin_id}' AND digital_object_id = '${id}' order by rowtime desc limit ${count};`;
         const retrievedData = await model.postgres.selectDataS({ sql });
         return retrievedData;
      } else {
         const sql = `SELECT * FROM digital_object_data WHERE federated_digital_twin_id='${federated_digital_twin_id}' AND digital_twin_id='${digital_twin_id}' AND digital_object_id = '${id}' order by rowtime desc limit 100;`;
         const retrievedData = await model.postgres.selectDataS({ sql });
         return retrievedData;
      }
   }

   /**
    * 저장된 모든 DO의 이름 조회
    * @returns {List}
    */
   async getAll({ federated_digital_twin_id, digital_twin_id }) {
      const sql = `select * from digital_objects where digital_twin_id = '${digital_twin_id}' and federated_digital_twin_id = '${federated_digital_twin_id}';`;
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

   /**
    * Digital Object의 Controller 제어
    * @param {String} digital_twin_id (required)
    * @param {String} digital_object_id (required)
    * @param {Json Array} control_messages (required)
    *
    * @returns {Json} {}
    */
   async createDOControlData(
      federated_digital_twin_id,
      digital_twin_id,
      digital_object_id,
      params
   ) {
      // params = [{ controller_id: string, control_data_creator : string, control_command : { } }]
      const control_creation_time = lib.timestamp();
      let sendData = [];

      if (!digital_twin_id || !digital_object_id) {
         throw new ErrorHandler(412, 412, "please check mandatory field.");
      }

      if (!Array.isArray(params) || params.length == 0) {
         throw new ErrorHandler(412, 412, "empty control message");
      }

      // DO 존재하는지 확인
      const isExistID = await model.postgres.checkIdExist({
         table: "digital_objects",
         check: "digital_object_id",
         id: digital_object_id,
         digital_twin_id,
         federated_digital_twin_id,
      });
      if (!isExistID) {
         throw new ErrorHandler(412, 412, "Unregistered digital_object");
      }

      /**
       * DO Control Access URL 조회
       */
      let { digital_object_control_url } = await this.Retrieve({
         federated_digital_twin_id,
         digital_twin_id,
         digital_object_id,
      });

      /**
       * control message 처리
       */
      // DO에 control messages 전달
      param.forEach((element) => {
         let digital_object_control_data_id = "C" + uuid();
         element.digital_object_control_data_id =
            digital_object_control_data_id;
         sendData.push(element);
      });
      let httpResponse = await lib.request({
         url: digital_object_control_url,
         bodyParams: sendData,
      });
      // httpResponse : [{digital_object_control_data_id : uuid , control_delivery_result : Fail}, ...] 라고 가정하고 진행
      const control_delivery_time = lib.timestamp();
      for (let do_control_data of httpResponse) {
         let data = sendData.filter(
            (element) =>
               element.digital_object_control_data_id ==
               do_control_data.digital_object_control_data_id
         );
         if (data.length !== 0) {
            let digital_object_control_data_id =
               do_control_data.digital_object_control_data_id;
            let controller_id = data[0].controller_id;
            let control_data_creator = data[0].control_data_creator;
            let control_delivery_result =
               do_control_data.control_delivery_result;
            let control_command = data[0].control_command;
            let sql = `insert into digital_object_controllers (digital_twin_id, digital_object_control_data_id, controller_id, control_data_creator, control_creation_time, control_delivery_time, control_delivery_result, control_command) values ('${digital_twin_id}', '${digital_object_control_data_id}', '${controller_id}', '${control_data_creator}', '${control_creation_time}', '${control_delivery_time}', '${control_delivery_result}', '${JSON.stringify(
               control_command
            )}');`;
            await model.postgres.sendQuery({ sql });
         }
      }
      return httpResponse;
   }

   /**
    * Digital Object의 Controller execution result 저장 --> kafka (control_exec_result)
    * @param {String} digital_twin_id (required)
    * @param {String} digital_object_id (required)
    * @param {String} control_data_id (required)
    * @param {Json Array} execution_result (required)
    *
    * @returns {Json} {}
    */
   async createDOExecutionData(
      federated_digital_twin_id,
      digital_twin_id,
      digital_object_id,
      digital_object_control_data_id,
      params
   ) {
      const digital_object_control_result_id = "C" + uuid();
      const control_execution_time = lib.timestamp();
      // const { controller_id, contrl_execution_result } = parmas;
      const { control_execution_result } = params;

      if (!digital_twin_id || !digital_object_id) {
         throw new ErrorHandler(412, 412, "please check mandatory field.");
      }

      if (!control_execution_time || !control_execution_result) {
         throw new ErrorHandler(
            412,
            412,
            "data needs control_execution_result field."
         );
      }
      let executionResultMessage = {
         digital_twin_id,
         digital_object_control_result_id,
         digital_object_control_data_id,
         control_execution_result,
         control_execution_time,
      };
      const kafkaKey = { digital_twin_id, digital_object_id };
      await model.kafka.kafkaProducer({
         topic: "control_exec_result",
         kafkaKey: JSON.stringify(kafkaKey),
         data: JSON.stringify(executionResultMessage),
      });

      // const sql = `insert into digital_object_control_result (digital_twin_id, digital_object_control_result_id, digital_object_control_data_id, control_execution_time, control_execution_result) values ('${digital_twin_id}', '${digital_object_control_result_id}', '${digital_object_control_data_id}', '${control_execution_time}', '${control_execution_result}');`;
      // await model.postgres.sendQuery({ sql });
      // return { digital_object_control_result_id, control_execution_result };
   }

   /**
    * digital_object contorl data 조회 - 최신 데이터
    * @param {string} digital_twin_id
    * @param {string} digital_object_id
    * @param {string} from startDateTime
    * @param {string} to endDateTime
    * @returns {Json} 기간별 조회
    */
   async searchControl({
      federated_digital_twin_id,
      digital_twin_id,
      digital_object_id,
      from,
      to,
   }) {
      if (!digital_twin_id || !digital_object_id) {
         throw new ErrorHandler(412, 412, "please check mandatory field.");
      }
      const isExistID = await model.postgres.checkIdExist({
         table: "digital_objects",
         check: "digital_object_id",
         digital_object_id,
         federated_digital_twin_id,
      });

      if (!isExistID) {
         throw new ErrorHandler(412, 412, "Unregistered digital_object");
      }

      if (from && to) {
         const sql = `SELECT * FROM digital_object_control_data WHERE digital_twin_id='${digital_twin_id}' AND rowtime >= '${from}'::timestamp AND rowtime <= '${to}'::timestamp;`;
         const retrievedData = await model.postgres.selectDataS({ sql });
         return retrievedData;
      } else if (from) {
         const sql = `SELECT * FROM digital_object_control_data WHERE digital_twin_id='${digital_twin_id}' AND rowtime >= '${from}'::timestamp;`;
         const retrievedData = await model.postgres.selectDataS({ sql });
         return retrievedData;
      } else if (to) {
         const sql = `SELECT * FROM digital_object_control_data WHERE digital_twin_id='${digital_twin_id}' AND rowtime <= '${to}'::timestamp;`;
         const retrievedData = await model.postgres.selectDataS({ sql });
         return retrievedData;
      } else {
         let sql = `select * from digital_object_control_data `;
         const retrievedData = await model.postgres.selectDataS({ sql });
         return retrievedData;
      }
   }

   /**
    * digital_object contorl data 조회 - id 조회
    * @param {string} digital_twin_id
    * @param {string} digital_object_id
    * @param {string} digital_object_control_data_id
    * @returns {Json}
    */
   async retrieveControl({
      federated_digital_twin_id,
      digital_twin_id,
      digital_object_id,
      digital_object_control_data_id,
   }) {
      if (
         !digital_twin_id ||
         !digital_object_id ||
         !digital_object_control_data_id
      ) {
         throw new ErrorHandler(412, 412, "please check mandatory field.");
      }
      const isExistID = await model.postgres.checkIdExist({
         table: "digital_object_controllers",
         check: "digital_object_control_data_id",
         digital_object_control_data_id,
         federated_digital_twin_id,
      });
      if (!isExistID) {
         throw new ErrorHandler(
            412,
            412,
            "Unregistered digital_object control data"
         );
      }

      let sql = `select * from control_data where digital_object_control_data_id = ${digital_object_control_data_id} `;

      const retrievedData = await model.postgres.selectDataS({ sql });
      return retrievedData;
   }
}

module.exports = DigitalObjects;
