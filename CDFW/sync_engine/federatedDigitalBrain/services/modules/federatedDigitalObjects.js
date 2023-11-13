const ErrorHandler = require("../../lib/error-handler");
const lib = require("../../lib/index");
const config = require("../../config");
const Model = require("../../models");
const model = new Model();

/**
 * createControl 함수에 url 주소 변경 시 적용하도록 수정필요
      control_messages.forEach(async (element) => {
         try {
            let createControlData 
 */
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
   async create(federated_twin_id, params) {
      try {
         // Check if the federated digital twin ID exists
         const isExistDtId = await model.postgres.checkIdExist({
            table: "federated_digital_twins",
            check: "federated_digital_twin_id",
            id: federated_twin_id,
         });
         if (!isExistDtId) {
            throw new ErrorHandler(
               412,
               5252,
               "Unregistered federatd digital-twin"
            );
         }
         // Fetch the federated digital twin data
         const selectDTsql = `select * from federated_digital_twins where federated_digital_twin_id = '${federated_twin_id}'`;
         const selectedDTdata = await model.postgres.selectData({
            sql: selectDTsql,
         });
         const FDOcount =
            parseInt(selectedDTdata.number_of_federated_digital_objects) + 1;

         const {
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

         //digital_twin_object_id리스트에서 digital_twin_object가 등록된 DO인지 확인
         for (let i in member_digital_twin_object_ids) {
            let isExistID = await model.postgres.checkIdExist({
               table: "digital_objects",
               check: "digital_object_id",
               id: member_digital_twin_object_ids[i],
            });
            if (!isExistID) {
               throw new ErrorHandler(
                  412,
                  5252,
                  "Unregistered digital twin object"
               );
            }
         }

         // fdo의 control의 경우에는 센서와 같이 병렬적으로 있는것이 아니라 하위에 포함되어 있음을 유의
         const creationTime = lib.timestamp();
         const federated_digital_object_id = "FDO" + uuid();
         const member_digital_twin_object_count =
            member_digital_twin_object_ids.length;

         let compose_sql = "";
         for (let i = 0; i < member_digital_twin_object_count; i++) {
            compose_sql += `INSERT INTO fdo_compositions (compose_id, federated_digital_twin_id, federated_digital_object_id, digital_object_id, rowtime) VALUES ('CP${uuid()}', '${federated_twin_id}', '${federated_digital_object_id}', '${
               member_digital_twin_object_ids[i]
            }', '${creationTime}');`;
         }

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
                        ) VALUES ('${federated_digital_object_id}', '${federated_twin_id}', '${federated_digital_object_name}', '${description}', '{${tags}}', '${access_url}', '${access_protocol}', '${creationTime}', '${creator_id}', '${creationTime}',
                          '${JSON.stringify(location)}', '${JSON.stringify(
            time_sync_cond
         )}', '${JSON.stringify(spatial_sync_cond)}',
                          ${member_digital_twin_object_count},'{${member_digital_twin_object_ids}}','${data_model_id}', 
                            '${JSON.stringify(preliminary_field)}');`;

         // let insertRelationsSQL = "";
         // insertRelationsSQL += await model.postgres.createinsertRelationSQL({
         //    parent_id: federated_digital_twin_id,
         //    resource_id: federated_digital_object_id,
         //    type: config.type.federatedDigitalObject,
         // });
         // insertRelationsSQL += await model.postgres.createinsertRelationSQL({
         //    parent_id: federated_digital_object_id,
         //    resource_id: member_digital_twin_object_ids,
         //    type: config.type.federatedDigitalObject,
         // });
         // insertRelationsSQL += await model.postgres.createinsertRelationSQL({
         //    parent_id: digital_object_id,
         //    resource_id: data_model_id,
         //    type: config.type.dataModel,
         // });
         // await model.postgres.sendQuery({ sql: insertRelationsSQL });

         const updateFDOcountSQL = `update federated_digital_twins set number_of_federated_digital_objects = ${FDOcount}, modification_time = '${lib.timestamp()}' where federated_digital_twin_id = '${federated_twin_id}';`;
         await model.postgres.sendQuery({
            sql: insert_sql + compose_sql + updateFDOcountSQL,
         });

         return { federated_digital_object_id };
      } catch (error) {
         console.log(error);
         throw new ErrorHandler(500, 5252, error);
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
            5252,
            "Unregistered federated-digital-objects"
         );
      }
   }

   /**
    * 저장된 federated-digitalObjects 검색
    * @param {string} name
    * @returns {Json}
    */
   async Search({ federated_twin_id, name }) {
      const isExistName = await model.postgres.checkNameExist({
         table: "federated_digital_objects",
         check: "federated_digital_object_name",
         name: name,
         federated_twin_id,
      });

      if (isExistName) {
         const sql = `select * from federated_digital_objects where federated_digital_object_name = '${name}' and federated_digital_twin_id = '${federated_twin_id}'`;
         const selectedData = await model.postgres.selectDataS({ sql });
         return selectedData;
      } else {
         throw new ErrorHandler(
            412,
            5252,
            "Unregistered federated-digital-objects"
         );
      }
   }

   /**
    * 기존에 저장된 FDO 내용 수정
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
            5252,
            "Unregistered federated_digital_object"
         );
      } else {
         let sql = `update federated_digital_objects set `;
         for (let key in params) {
            if (key === "member_digital_twin_object_ids") {
               //string array type
               for (let i in params[key]) {
                  let isExistID = await model.postgres.checkIdExist({
                     table: "digital_twin_objects",
                     check: "digital_twin_object_id",
                     id: params[key][i],
                  });
                  if (!isExistID) {
                     throw new ErrorHandler(
                        412,
                        5252,
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
               /*
            else if (key === "member_digital_twin_object_controller_ids") {
               for (let i in params[key]) {
                  let isExistID = await model.postgres.checkIdExist({
                     table: "digital_twin_obeject_controllers",
                     check: "digital_twin_object_controller_id",
                     id: params[key][i],
                  });
                  if (!isExistID) {
                     throw new ErrorHandler(
                        412,
                        5252,
                        "Unregistered controller"
                     );
                  }
               }
               sql += `${key} = '{${lib.arryToEnum(params[key])}}', `;
            } */
               sql += `${key} = '{${params[key]}}', `;
            } else if (
               //json type
               key === "location" ||
               key === "time_sync_cond" ||
               key === "spatial_sync_cond" ||
               key === "preliminary_field"
            ) {
               sql += `${key} = '${JSON.stringify(params[key])}', `;
            } else {
               //string type
               sql += `${key} = '${params[key]}', `;
            }
         }
         sql += ` modification_time='${lib.timestamp()}' where federated_digital_object_id = '${id}' and federated_digital_twin_id = '${federated_digital_twin_id}'`;
         await model.postgres.sendQuery({ sql });

         if (params.member_digital_twin_object_ids) {
            const deleteDOcomposeSQL = `delete from fdo_compositions where federated_digital_object_id='${id}' and federated_digital_twin_id = '${digital_twin_id}';`;
            let compose_sql = "";
            for (let i = 0; i < member_digital_twin_object_ids.length; i++) {
               compose_sql += `INSERT INTO fdo_compositions (compose_id, federated_digital_twin_id, federated_digital_object_id, digital_object_id, rowtime) VALUES ('CP${uuid()}', '${federated_twin_id}', '${federated_digital_object_id}', '${
                  member_digital_twin_object_ids[i]
               }', '${creationTime}');`;
            }
            await model.postgres.sendQuery({
               sql: deleteDOcomposeSQL + compose_sql,
            });
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
            5252,
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
         //delete from relations where resource_id = '{${id}}' or parent_id = '${id}';
         const deleteSQL = `delete from federated_digital_objects where federated_digital_object_id = '${id}'; delete from federated_digital_object_data where federated_digital_object_id = '${id}';`;
         const deleteFDOcomposeSQL = `delete from fdo_compositions where federated_digital_object_id='${id}' and federated_digital_twin_id = '${federated_digital_twin_id}';`;

         await model.postgres.sendQuery({
            sql: updateFDOcountSQL + deleteSQL + deleteFDOcomposeSQL,
         });

         return { delete: id };
      }
   }

   /**
    * federated_digital_object data 조회
    * example)
    * url = http://{{ip}}:1209/mirrorlake/v1/D46d8c5717a08988190a816a71edff08e/digital_objects/S449fd692f225c086862abc729030aeb8/data?from=2023-03-12T23:32:01.232&to=2023-04-12T06:48:45.232
    * set time sql = SELECT * FROM digital_object_data WHERE digital_twin_id='D46d8c5717a08988190a816a71edff08e' AND digital_object_id = 'S449fd692f225c086862abc729030aeb8' AND rowtime >= '2023-03-12T23:32:01.232'::timestamp AND rowtime <= '2023-04-12T06:48:45.232'::timestamp;
    * default sql = SELECT * FROM digital_object_data WHERE digital_twin_id='D46d8c5717a08988190a816a71edff08e' AND digital_object_id = 'S449fd692f225c086862abc729030aeb8' order by rowtime desc limit 100;
    * @param {string} federated_digital_twin_id
    * @param {string} id digital_object_id
    * @param {string} from startDateTime
    * @param {string} to endDateTime
    * @returns {Json} 기간별 조회
    */
   async getData({ federated_digital_twin_id, id, from, to, count }) {
      const isExistID = await model.postgres.checkIdExist({
         table: "federated_digital_objects",
         check: "federated_digital_object_id",
         id,
         federated_digital_twin_id,
      });
      if (!isExistID) {
         throw new ErrorHandler(
            412,
            5252,
            "Unregistered federated_digital_object"
         );
      }

      if (from && to) {
         const sql = `SELECT * FROM federated_digital_object_data WHERE federated_digital_twin_id='${federated_digital_twin_id}' AND federated_digital_object_id = '${id}' AND rowtime >= '${from}'::timestamp AND rowtime <= '${to}'::timestamp;`;
         const retrievedData = await model.postgres.selectDataS({ sql });
         return retrievedData;
      } else if (count) {
         const sql = `SELECT * FROM federated_digital_object_data WHERE federated_digital_twin_id='${federated_digital_twin_id}' AND federated_digital_object_id = '${id}' order by rowtime desc limit ${count};`;
         const retrievedData = await model.postgres.selectDataS({ sql });
         return retrievedData;
      } else {
         const sql = `SELECT * FROM federated_digital_object_data WHERE federated_digital_twin_id='${federated_digital_twin_id}' AND federated_digital_object_id = '${id}' order by rowtime desc limit 100;`;
         const retrievedData = await model.postgres.selectDataS({ sql });
         return retrievedData;
      }
   }

   /**
    * 저장된 모든 DO의 이름 조회
    * @returns {List}
    */
   async getAll({ federated_twin_id }) {
      const sql = `select * from federated_digital_objects where federated_digital_twin_id = '${federated_twin_id}';`;
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
      const control_messages = params;
      let returnMessage = [];

      if (
         !federated_digital_twin_id ||
         !federated_digital_object_id ||
         !control_messages
      ) {
         throw new ErrorHandler(412, 5252, "please check mandatory field.");
      }

      if (!Array.isArray(control_messages) || control_messages.length == 0) {
         throw new ErrorHandler(412, 5252, "empty control message");
      }

      /**
       * get FDO's controller id list
       */
      let { controller_id } = await this.Retrieve({
         federated_digital_twin_id,
         federated_digital_object_id,
      });
      let FDO_controller_id = controller_id;
      if (FDO_controller_id == null || FDO_controller_id == undefined) {
         throw new ErrorHandler(
            412,
            5252,
            "Controllers are not registered with Federated Digital Object."
         );
      }
      if (!Array.isArray(FDO_controller_id) || FDO_controller_id.length == 0) {
         throw new ErrorHandler(
            412,
            5252,
            "Controllers are not registered with Federated Digital Object."
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

         let isIncludeID = FDO_controller_id.includes(element.controller_id);

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
               `${element.controller_id} controller is not registered with federated Digital Object(${federated_digital_object_id}).`
            );
         }
      });

      // url 주소 변경 시 적용하도록 수정필요
      control_messages.forEach(async (element) => {
         try {
            let createControlData = await lib.request({
               url: `http://${config.federatedDigitalConnector.ip}:${config.federatedDigitalConnector.port}/${config.federatedDigitalConnector.base}/${federated_digital_twin_id}/controllers/${element.controller_id}/data`,
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
    * @param {string} federated_digital_twin_id
    * @param {string} id federated_digital_object_id
    * @param {string} from startDateTime
    * @param {string} to endDateTime
    * @returns {Json} 기간별 조회
    */
   async retrieveControl({
      federated_digital_twin_id,
      federated_digital_object_id,
   }) {
      if (!federated_digital_twin_id || !federated_digital_object_id) {
         throw new ErrorHandler(412, 5252, "please check mandatory field.");
      }
      const isExistID = await model.postgres.checkIdExist({
         table: "federated_digital_objects",
         check: "federated_digital_object_id",
         federated_digital_object_id,
      });
      if (!isExistID) {
         throw new ErrorHandler(412, 5252, "Unregistered digital_object");
      }

      // Get federated Digital Object's Controller list
      let { controller_id } = await this.Retrieve({
         federated_digital_twin_id,
         federated_digital_object_id,
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

module.exports = FederatedDigitalObjects;
