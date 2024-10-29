const Model = require("../../models");
const ErrorHandler = require("../../lib/error-handler");
const lib = require("../../lib");
const config = require("../../config");
const logger = require("../../lib/logger");
const { fontsSync } = require("figlet");
const model = new Model();

class VisualModel {
   /**
    * visualModel create
    * @param {String} visual_model_id (system)
    * @param {String} federated_digital_twin_id (system)
    * @param {String} visual_model_name (required)
    * @param {String} description (required)
    * @param {Stringn array} keywords (required)
    * @param {String} creation_time (system)
    * @param {String} creator_id (required)
    * @param {String} modification_time (system)
    * @param {String} visual_model_access_url (system)
    * @param {String enum} visual_model_format (system)
    * @param {Integer} visual_model_file_size (system)
    * @param {String} location (system)
    * @param {Object} visual_data (required)
    *
    * @returns {Json} {}
    */
   async create(federated_digital_twin_id, req) {
      let visualModelCount;
      const isExistDtId = await model.postgres.checkIdExist({
         table: "federated_digital_twins",
         check: "federated_digital_twin_id",
         id: federated_digital_twin_id,
      });
      if (!isExistDtId) {
         throw new ErrorHandler(412, 5252, "Unregistered digital-twin");
      } else {
         const selectDTsql = `select * from federated_digital_twins where federated_digital_twin_id = '${federated_digital_twin_id}'`;
         const selectedDTdata = await model.postgres.selectData({
            sql: selectDTsql,
         });
         visualModelCount =
            parseInt(selectedDTdata.number_of_visual_models) + 1;
      }
      const { visual_model_name, description, keywords, creator_id } = req.body;
      const visual_data = req.file;

      const isExistName = await model.postgres.checkNameExist({
         table: "federated_visual_models",
         check: "visual_model_name",
         name: visual_model_name,
         federated_digital_twin_id,
      });
      if (isExistName) {
         throw new ErrorHandler(
            409,
            4091,
            `${visual_model_name} is already exist`
         );
      }

      // const visual_model_id = uuid();
      if (visual_data?.originalname) {
         const visual_model_format = path.extname(visual_data.originalname);
         const visual_model_id = path.basename(
            visual_data.filename,
            visual_model_format
         );
         const creation_time = lib.timestamp();
         const modification_time = creation_time;
         const address = {
            access_ip: config.nginx.ip
               ? config.nginx.ip
               : config.federatedDigitalBrain.ip,
            access_port: config.nginx.port
               ? config.nginx.port
               : config.federatedDigitalBrain.port,
         };
         const visual_model_access_url = `http://${address.access_ip}:${address.access_port}/${config.federatedDigitalBrain.base}/${federated_digital_twin_id}/visual-models/${visual_model_id}/download`;
         const visual_model_file_size = visual_data.size;
         const location = visual_data.destination;

         let sql = `INSERT INTO federated_visual_models  (
            visual_model_id,
            federated_digital_twin_id,
            visual_model_name,
            description,
            creation_time,
            creator_id,
            modification_time,
            visual_model_access_url, 
            visual_model_format,
            visual_model_file_size,
            location,
            keywords
         ) VALUES ('${visual_model_id}', '${federated_digital_twin_id}', '${visual_model_name}', '${description}', '${creation_time}', '${creator_id}', '${modification_time}', '${visual_model_access_url}', '${visual_model_format}', '${visual_model_file_size}', '${location}', '{${keywords}}'); `;
         const updatevisualModelCountSQL = `update federated_digital_twins set number_of_visual_models = ${visualModelCount}, modification_time = '${lib.timestamp()}' where federated_digital_twin_id = '${federated_digital_twin_id}';`;

         await model.postgres.sendQuery({
            sql: sql + updatevisualModelCountSQL,
         });

         return { visual_model_id };
      } else {
         return {
            Failure: "visual data does not exist",
         };
      }
   }

   /**
    * visualModel 이름 검색
    * @param {string} name
    * @returns {Json}
    */
   async search({ federated_digital_twin_id, name }) {
      if (!federated_digital_twin_id || !name) {
         throw new ErrorHandler(412, 5252, "please check mandatory field.");
      }

      const isExistName = await model.postgres.checkNameExist({
         table: "federated_visual_models",
         check: "visual_model_name",
         name: name,
         federated_digital_twin_id,
      });

      if (isExistName) {
         const sql = `select * from federated_visual_models where visual_model_name = '${name}' and federated_digital_twin_id = '${federated_digital_twin_id}'`;
         const selectedData = await model.postgres.selectDataS({ sql });
         return selectedData;
      } else {
         return "Unregistered visual model";
      }
   }

   /**
    * 저장된 모든 visual model의 이름 조회
    * @returns {List}
    */
   async getAll({ federated_digital_twin_id }) {
      const sql = `select * from federated_visual_models where federated_digital_twin_id = '${federated_digital_twin_id}';`;
      const visualModelEntireList = await model.postgres.selectDataS({ sql });

      return visualModelEntireList;
   }

   /**
    * visualModel ID 조회
    * @param {string} name
    * @returns {Json}
    */
   async retrieve({ federated_digital_twin_id, visual_model_id }) {
      if (!federated_digital_twin_id || !visual_model_id) {
         throw new ErrorHandler(412, 5252, "please check mandatory field.");
      }

      const isExistID = await model.postgres.checkIdExist({
         table: "federated_visual_models",
         check: "visual_model_id",
         id: visual_model_id,
         federated_digital_twin_id,
      });
      // visual model이 존재하면 조회
      if (!isExistID) {
         throw new ErrorHandler(412, 5252, "Unregistered visual model");
      } else {
         const sql = `select * from federated_visual_models where visual_model_id = '${visual_model_id}' and federated_digital_twin_id = '${federated_digital_twin_id}'`;
         const selectedData = await model.postgres.selectData({ sql });
         return selectedData;
      }
   }

   /**
    * visualModel ID 조회
    * @param {string} name
    * @returns {Json}
    */
   async download({ federated_digital_twin_id, visual_model_id }) {
      if (!federated_digital_twin_id || !visual_model_id) {
         throw new ErrorHandler(412, 5252, "please check mandatory field.");
      }

      const isExistID = await model.postgres.checkIdExist({
         table: "federated_visual_models",
         check: "visual_model_id",
         id: visual_model_id,
         federated_digital_twin_id,
      });
      // visual model이 존재하면 조회
      if (!isExistID) {
         throw new ErrorHandler(412, 5252, "Unregistered visual model");
      } else {
         let { visual_model_name, location, visual_model_format } =
            await this.retrieve({
               federated_digital_twin_id,
               visual_model_id,
            });
         const file = `${location}/${visual_model_id}${visual_model_format}`;
         // const sql = `select * from federated_visual_models where visual_model_id = '${visual_model_id}'`;
         // const selectedData = await model.postgres.selectData({ sql });
         return file;
      }
   }

   /**
    * visual model update
    * @param {String} visual_model_id
    * @returns {Json}
    */
   async update({ federated_digital_twin_id, visual_model_id }, params) {
      if (!federated_digital_twin_id || !visual_model_id) {
         throw new ErrorHandler(412, 5252, "please check mandatory field.");
      }

      const isExistID = await model.postgres.checkIdExist({
         table: "federated_visual_models",
         check: "visual_model_id",
         id: visual_model_id,
         federated_digital_twin_id,
      });

      // visual model이 존재하면 update
      if (!isExistID) {
         throw new ErrorHandler(412, 5252, "Unregistered visual model");
      } else {
         let sql = `UPDATE federated_visual_models SET `;

         for (let key in params) {
            if (key === "keywords") {
               //string array type
               sql += `${key} = '{${lib.arryToEnum(params[key])}}', `;
            } else {
               //string type
               sql += `${key} = '${params[key]}', `;
            }
         }
         sql += ` modification_time='${lib.timestamp()}' where visual_model_id = '${visual_model_id}' and federated_digital_twin_id = '${federated_digital_twin_id}'`;

         await model.postgres.sendQuery({ sql });
         return { update: visual_model_id };
      }
   }

   /**
    * visual model delete
    * @param {string} visual_model_id
    * @returns {Json}
    */
   async delete({ federated_digital_twin_id, visual_model_id }) {
      if (!federated_digital_twin_id || !visual_model_id) {
         throw new ErrorHandler(412, 5252, "please check mandatory field.");
      }

      const isExistID = await model.postgres.checkIdExist({
         table: "federated_visual_models",
         check: "visual_model_id",
         id: visual_model_id,
         federated_digital_twin_id,
      });

      if (isExistID) {
         const selectDTsql = `select * from digital_twins where federated_digital_twin_id = '${federated_digital_twin_id}'`;
         const selectedDTdata = await model.postgres.selectData({
            sql: selectDTsql,
         });
         const visualModelCount =
            parseInt(selectedDTdata.number_of_visual_models) - 1;
         const updatevisualModelCountSQL = `update digital_twins set number_of_visual_models = ${visualModelCount}, modification_time = '${lib.timestamp()}' where federated_digital_twin_id = '${federated_digital_twin_id}'; `;

         const { location, visual_model_format } = await this.retrieve({
            federated_digital_twin_id,
            visual_model_id,
         });
         try {
            fs.unlinkSync(
               `${location}/${visual_model_id}${visual_model_format}`
            );
            logger.info(
               `Visual Model File Delete Success : ${location}/${visual_model_id}${visual_model_format}`
            );
         } catch (e) {
            logger.error("Visual Model File Delete Fail : ", e);
         }
         const sql = `delete from federated_visual_models where visual_model_id = '${visual_model_id}' and federated_digital_twin_id = '${federated_digital_twin_id}';`;
         await model.postgres.sendQuery({
            sql: updatevisualModelCountSQL + sql,
         });

         return { delete: visual_model_id };
      } else {
         throw new ErrorHandler(412, 5252, "Unregistered visual model");
      }
   }
}

module.exports = VisualModel;
