const Model = require("../../models");
const model = new Model();
const ErrorHandler = require("../../lib/error-handler");
const lib = require("../../lib/index");
const config = require("../../config");
class DigitalTwins {
  /**
   * digitalTwin information create in FDT Meta data
   * @param {String} digital_twin_id (required)
   * @param {String} digital_twin_name (required)
   * @param {String} description (optional)
   * @param {String} owner (opitional)
   * @param {array} keywords (optional)
   * @param {String} creation_time (system)
   * @param {String} creator_id (optional)
   * @param {String} modification_time (optional)
   * @param {String} point_of_access (optional)
   * @param {String} contact_point (optional)
   * @param {String} subjects (optional)
   * @param {JSON} location (required)
   * @param {array} member_digital_objects_ids (required)
   * @param {number} number_of_digital_objects (required)
   * @param {number} number_of_services (required)
   * @param {number} number_of_simulations (required)
   * @returns {Boolean} true
   */
  async create(params) {
    const {
      digital_twin_identifier,
      digital_twin_name,
      description,
      owner,
      keywords,
      creation_time,
      creator_id,
      modification_time,
      point_of_access,
      contact_point,
      subjects,
      location,
      member_digital_objects_ids,
      number_of_digital_objects,
      number_of_services,
      number_of_simulations,
    } = params;

    let digital_twin_id = digital_twin_identifier || "DT" + uuid();

    // Check if digital twin ID already exists
    const isExistDtId = await model.postgres.checkIdExist({
      table: "digital_twins",
      check: "digital_twin_id",
      id: digital_twin_id,
    });
    if (isExistDtId) {
      throw new ErrorHandler(
        412,
        412,
        "digital_twin_identifier already in use"
      );
    }

    const formattedCreationTime = creation_time ? `'${creation_time}'` : null;
    const formattedModificationTime = modification_time
      ? `'${modification_time}'`
      : null;

    const insertSQL = `insert into digital_twins (
         digital_twin_id,
         digital_twin_name,
         description,
         owner,
         keywords,
         creation_time,
         creator_id,
         modification_time,
         point_of_access,
         contact_point,
         subjects,
         location,
         member_digital_objects_ids,
         number_of_digital_objects,
         number_of_services,
         number_of_simulations
         ) values (
            '${digital_twin_id}',
            '${digital_twin_name}',
            '${description}',
            '${owner}',
            '{${keywords}}',
            ${formattedCreationTime},
            '${creator_id}',
            ${formattedModificationTime},
            '${point_of_access}',
            '${contact_point}',
            '{${subjects}}',
            '${JSON.stringify(location)}',
            '{${member_digital_objects_ids}}',
            ${number_of_digital_objects},
            ${number_of_services},
            ${number_of_simulations}
         );`;

    await model.postgres.sendQuery({ sql: insertSQL });
    return { digital_twin_id };
  }

  /**
   * @param {string} digital_twin_id
   * @returns {Json}
   */
  async Export({ digital_twin_id }) {
    const resourceArr = ["digital_objects", "services", "simulations"];

    const sql = `select digital_twin_id from digital_twins`;
    const Twinlist = await model.postgres.selectData({ sql });

    const total_return = {};

    for (const tmp_twin_id in Twinlist) {
      const sql = `select * from digital_twins where digital_twin_id = '${tmp_twin_id}'`;
      const TwinResource = await model.postgres.selectData({ sql });
      let getAllResourceSQL = ``;
      for (const i in resourceArr) {
        getAllResourceSQL += `select * from ${resourceArr[i]} where digital_twin_id = '${digital_twin_id}'; `;
      }
      const resources = await model.postgres.select({
        sql: getAllResourceSQL,
      });

      for (let i = 0; i < resources.length; i++) {
        const rows = resources[i].rows;
        TwinResource[resourceArr[i]] = rows;
      }
      total_return += TwinResource;
    }
    return total_return;
  }

  /**
   * @param {string} id
   * @returns {Json}
   */
  async Retrieve({ digital_twin_id }) {
    const sql = `select * from digital_twins where digital_twin_id = '${digital_twin_id}'`;
    const selectedData = await model.postgres.selectData({ sql });
    return selectedData;
  }

  /**
   * @param {string} name
   * @returns {Json}
   */
  async Search({ name }) {
    const sql = `select * from digital_twins where digital_twin_name = '${name}'`;
    const selectedData = await model.postgres.selectData({ sql });
    return selectedData;
  }

  /**
   * digitalTwin update
   * @param
   * @returns {Boolean} true
   */
  async update(digital_twin_id, params) {
    const isExistID = await model.postgres.checkIdExist({
      table: "digital_twins",
      check: "digital_twin_id",
      id: digital_twin_id,
    });

    if (!isExistID) {
      throw new ErrorHandler(412, 412, "Unregistered digital_twin");
    } else {
      let sql = `update digital_twins set `;
      let hasSetClause = false;
      for (let key in params) {
        if (key === "location") {
          sql += `${hasSetClause ? ", " : ""}${key} = '${JSON.stringify(
            params[key]
          )}'`;
        } else if (
          key === "keywords" ||
          key === "subjects" ||
          key === "member_digital_objects_ids"
        ) {
          sql += `${hasSetClause ? ", " : ""}${key} = '{${params[key]}}'`;
        } else {
          sql += `${hasSetClause ? ", " : ""}${key} = '${params[key]}'`;
        }
        hasSetClause = true;
      }
      sql += `where digital_twin_id = '${digital_twin_id}';`;
      await model.postgres.sendQuery({ sql });

      return { update: digital_twin_id };
    }
  }

  /**
   *  digitalTwin 삭제
   * @param {string} name
   * @returns {Json}
   */
  async delete({ digital_twin_id }) {
    const isExistID = await model.postgres.checkIdExist({
      table: "digital_twins",
      check: "digital_twin_id",
      id: digital_twin_id,
    });

    if (isExistID) {
      const selectDOsql = `SELECT * FROM digital_objects WHERE digital_twin_id = '${digital_twin_id}'`;
      const selectedDOs = await model.postgres.selectDataS({
        sql: selectDOsql,
      });

      for (const selectedDO of selectedDOs) {
        if (selectedDO.digital_object_data_source_type === "POLL") {
          await model.kafka.deleteSink({
            id: `HttpSource${selectedDO.digital_object_id}`,
          });
        }
      }
      const deleteSQLs = [
        `DELETE FROM digital_twins WHERE digital_twin_id = '${digital_twin_id}';`,
        `DELETE FROM digital_objects WHERE digital_twin_id = '${digital_twin_id}';`,
        `DELETE FROM digital_object_data WHERE digital_twin_id = '${digital_twin_id}';`,
        `DELETE FROM digital_object_controllers WHERE digital_twin_id = '${digital_twin_id}';`,
        `DELETE FROM simulations WHERE digital_twin_id = '${digital_twin_id}';`,
        `DELETE FROM services WHERE digital_twin_id = '${digital_twin_id}';`,
      ];
      const deleteSQL = deleteSQLs.join("\n");
      await model.postgres.sendQuery({ sql: deleteSQL });

      return { delete: digital_twin_id };
    } else {
      throw new ErrorHandler(
        412,
        412,
        "Unregistered digital-twin or already deleted"
      );
    }
  }

  /**
   * 저장된 모든 digitalTwin의 이름 조회
   * @returns {List}
   */
  async getAll() {
    const sql = `select * from digital_twins`;
    const DTentireList = await model.postgres.selectDataS({ sql });

    return DTentireList;
  }

  /**
   * sensor data 날짜별 집계 조회
   * example)
   * url = http://{{ip}}:1209/mirrorlake/v1/data_count?count=30
   * set count sql = select rowtime::DATE, count(*) from sensor_data group by rowtime::DATE order by rowtime::DATE desc limit 300;
   * default sql = select rowtime::DATE, count(*) from sensor_data group by rowtime::DATE order by rowtime::DATE desc;
   * @param {string} from
   * @returns {Json} 날짜별 집계 조회
   */
  async retrieveSensorDataCount({ from }) {
    if (from) {
      const sql = `select rowtime::DATE, digital_twin_id, count(*) from digital_object_data where rowtime between '${from}' and now() group by digital_twin_id, rowtime::DATE order by rowtime::DATE;`;
      const retrievedData = await model.postgres.selectDataS({ sql });
      return retrievedData;
    } else {
      const sql = `select rowtime::DATE, digital_twin_id, count(*) from digital_object_data group by digital_twin_id, rowtime::DATE order by rowtime::DATE;`;
      const retrievedData = await model.postgres.selectDataS({ sql });
      return retrievedData;
    }
  }

  /**
   * sensor data 날짜별 집계 조회
   * example)
   * url = http://{{ip}}:1209/mirrorlake/v1/data_count?count=30
   * set count sql = select rowtime::DATE, count(*) from sensor_data group by rowtime::DATE order by rowtime::DATE desc limit 300;
   * default sql = select rowtime::DATE, count(*) from sensor_data group by rowtime::DATE order by rowtime::DATE desc;
   * @returns {Json} 날짜별 집계 조회
   */
  async retrieveSensorDataCountAll() {
    const sql = `select count(*) from digital_object_data;`;
    const retrievedData = await model.postgres.selectDataS({ sql });
    return retrievedData;
  }
}

module.exports = DigitalTwins;
