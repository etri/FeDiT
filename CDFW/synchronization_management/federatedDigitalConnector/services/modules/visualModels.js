const Model = require("../../models");
const ErrorHandler = require("../../lib/error-handler");
const lib = require("../../lib");
const config = require("../../config");
const { fontsSync } = require("figlet");
const model = new Model();

class VisualModel {
  /**
   * visualModel create
   * @param {String} visual_model_id (system)
   * @param {String} digital_twin_id (system)
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
  async create(digital_twin_id, params) {
    const {
      visual_model_identifier,
      visual_model_name,
      description,
      creation_time,
      modification_time,
      keywords,
      subjects,
      visual_model_access_url,
      visual_model_format,
      visual_model_file_size,
      level_of_details,
    } = params;

    let visual_model_id = visual_model_identifier || "VM" + uuid();
    const isExistVisId = await model.postgres.checkIdExist({
      table: "visual_models",
      check: "visual_model_id",
      id: visual_model_id,
      digital_twin_id,
    });

    if (isExistVisId) {
      throw new ErrorHandler(
        412,
        412,
        "visual_model_identifier already in use",
      );
    }

    const formattedCreationTime = creation_time ? `'${creation_time}'` : null;
    const formattedModificationTime = modification_time
      ? `'${modification_time}'`
      : null;

    let sql = `INSERT INTO visual_models  (
            visual_model_id,
            digital_twin_id,
            visual_model_name,
            description,
            creation_time,
            modification_time,
            visual_model_access_url, 
            visual_model_format,
            visual_model_file_size,
            level_of_details,          
            subjects,
            keywords
         ) VALUES ('${visual_model_id}', '${digital_twin_id}', '${visual_model_name}', 
         '${description}', ${formattedCreationTime}, ${formattedModificationTime}, 
         '${visual_model_access_url}', '${visual_model_format}', '${visual_model_file_size}', 
         ${level_of_details}, '{${subjects}}', '{${keywords}}'); `;

    await model.postgres.sendQuery({ sql });

    return { visual_model_id };
  }

  /**
   * visualModel 이름 검색
   * @param {string} name
   * @returns {Json}
   */
  async search({ digital_twin_id, name }) {
    if (!digital_twin_id || !name) {
      throw new ErrorHandler(412, 5252, "please check mandatory field.");
    }

    const isExistName = await model.postgres.checkNameExist({
      table: "visual_models",
      check: "visual_model_name",
      name: name,
      digital_twin_id,
    });

    if (isExistName) {
      const sql = `select * from visual_models where visual_model_name = '${name}' and digital_twin_id = '${digital_twin_id}'`;
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
  async getAll({ digital_twin_id }) {
    const sql = `select * from visual_models where digital_twin_id = '${digital_twin_id}';`;
    const visualModelEntireList = await model.postgres.selectDataS({ sql });

    return visualModelEntireList;
  }

  /**
   * visualModel ID 조회
   * @param {string} name
   * @returns {Json}
   */
  async retrieve({ digital_twin_id, visual_model_id }) {
    if (!digital_twin_id || !visual_model_id) {
      throw new ErrorHandler(412, 5252, "please check mandatory field.");
    }

    const isExistID = await model.postgres.checkIdExist({
      table: "visual_models",
      check: "visual_model_id",
      id: visual_model_id,
      digital_twin_id,
    });
    // visual model이 존재하면 조회
    if (!isExistID) {
      throw new ErrorHandler(412, 5252, "Unregistered visual model");
    } else {
      const sql = `select * from visual_models where visual_model_id = '${visual_model_id}' and digital_twin_id = '${digital_twin_id}'`;
      const selectedData = await model.postgres.selectData({ sql });
      return selectedData;
    }
  }

  /**
   * visualModel ID 조회
   * @param {string} name
   * @returns {Json}
   */
  async download({ digital_twin_id, visual_model_id }) {
    if (!digital_twin_id || !visual_model_id) {
      throw new ErrorHandler(412, 5252, "please check mandatory field.");
    }

    const isExistID = await model.postgres.checkIdExist({
      table: "visual_models",
      check: "visual_model_id",
      id: visual_model_id,
      digital_twin_id,
    });
    // visual model이 존재하면 조회
    if (!isExistID) {
      throw new ErrorHandler(412, 5252, "Unregistered visual model");
    } else {
      let { visual_model_name, location, visual_model_format } =
        await this.retrieve({
          digital_twin_id,
          visual_model_id,
        });
      const file = `${location}/${visual_model_id}${visual_model_format}`;
      // const sql = `select * from visual_models where visual_model_id = '${visual_model_id}'`;
      // const selectedData = await model.postgres.selectData({ sql });
      return file;
    }
  }

  /**
   * visual model update
   * @param {String} visual_model_id
   * @returns {Json}
   */
  async update({ digital_twin_id, visual_model_id }, params) {
    if (!digital_twin_id || !visual_model_id) {
      throw new ErrorHandler(412, 5252, "please check mandatory field.");
    }

    const isExistVisId = await model.postgres.checkIdExist({
      table: "visual_models",
      check: "visual_model_id",
      id: visual_model_id,
      digital_twin_id,
    });

    // visual model이 존재하면 update
    if (!isExistVisId) {
      throw new ErrorHandler(412, 5252, "Unregistered visual model");
    } else {
      let sql = `UPDATE visual_models SET `;

      for (let key in params) {
        if (params[key] === undefined) continue;

        if (key === "keywords" || key === "subjects") {
          // string array type
          sql += `${key} = '{${lib.arryToEnum(params[key])}}', `;
        } else if (key === "level_of_details") {
          // number type
          sql += `level_of_details = ${params[key]}, `;
        } else {
          // string type
          sql += `${key} = '${params[key]}', `;
        }
      }

      // 업데이트할 값이 하나도 없는 경우 방지
      if (sql === "UPDATE visual_models SET ") {
        throw new ErrorHandler(400, 400, "No fields to update");
      }

      // 마지막 ", " 제거
      sql = sql.slice(0, -2);

      sql += ` where visual_model_id = '${visual_model_id}' and digital_twin_id = '${digital_twin_id}'`;

      await model.postgres.sendQuery({ sql });
      return { update: visual_model_id };
    }
  }

  /**
   * visual model delete
   * @param {string} visual_model_id
   * @returns {Json}
   */
  async delete({ digital_twin_id, visual_model_id }) {
    if (!digital_twin_id || !visual_model_id) {
      throw new ErrorHandler(412, 5252, "please check mandatory field.");
    }

    const isExistID = await model.postgres.checkIdExist({
      table: "visual_models",
      check: "visual_model_id",
      id: visual_model_id,
      digital_twin_id,
    });

    if (isExistID) {
      const sql = `delete from visual_models where visual_model_id = '${visual_model_id}' and digital_twin_id = '${digital_twin_id}';`;
      await model.postgres.sendQuery({ sql });

      return { delete: visual_model_id };
    } else {
      throw new ErrorHandler(412, 5252, "Unregistered visual model");
    }
  }
}

module.exports = VisualModel;
