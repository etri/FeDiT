const Model = require("../../models");
const ErrorHandler = require("../../lib/error-handler");
const model = new Model();
const lib = require("../../lib");
const config = require("../../config");
class Services {
  /**
   * service create
   * @param {String} service_id (system)
   * @param {String} service_name (required)
   * @param {String} description (required)
   * @param {String Array} keywords (required)
   * @param {String} creation_time (system)
   * @param {String} creator_id (required)
   * @param {String} modification_time (system)
   * @param {String} service_access_url (required)
   * @param {String} authorization (required)
   * @param {String} service_request_param (required)
   * @param {String} service_response_info (required)
   * @param {String} response_format_type(required)
   * @param {String} interface_type (required)
   * @param {String} error_info (required)
   * @param {JSON} preliminary_field
   * @returns {Json}
   */
  async create(digital_twin_id, params) {
    const {
      service_identifier,
      service_name,
      description,
      keywords,
      subjects,
      creation_time,
      modification_time,
      service_access_url,
      authorization,
      service_request_param,
      service_response_info,
      response_format_type,
      interface_type,
      error_info,
      preliminary_field,
    } = params;

    let service_id = service_identifier || "SER" + uuid();

    const isExistServiceId = await model.postgres.checkIdExist({
      table: "services",
      check: "service_id",
      id: service_id,
    });
    if (isExistServiceId) {
      throw new ErrorHandler(412, 412, "service_identifier already in use");
    }

    const formattedCreationTime = creation_time ? `'${creation_time}'` : null;
    const formattedModificationTime = modification_time
      ? `'${modification_time}'`
      : null;

    const sql = `INSERT INTO services (
         service_id, 
         digital_twin_id, 
         service_name, 
         description, 
         keywords, 
         subjects,
         creation_time, 
         modification_time, 
         service_access_url, 
         "authorization", 
         service_request_param, 
         service_response_info, 
         response_format_type, 
         interface_type, 
         error_info, 
         preliminary_field
      ) VALUES (
         '${service_id}', 
         '${digital_twin_id}', 
         '${service_name}', 
         '${description}', 
         '{${keywords}}', 
         '{${subjects}}', 
         ${formattedCreationTime},
         ${formattedModificationTime},
         '${service_access_url}', 
         '${authorization}', 
         '${JSON.stringify(service_request_param)}', 
         '${JSON.stringify(service_response_info)}', 
         '${response_format_type}', 
         '${interface_type}', 
         '${JSON.stringify(error_info)}', 
         '${JSON.stringify(preliminary_field)}'
      );`;

    await model.postgres.sendQuery({ sql });

    return { service_id };
  }

  /**
   * 이름으로 저장된 service 검색
   * @param {string}
   * @returns {string}
   */
  async search({ digital_twin_id, name }) {
    const isExistName = await model.postgres.checkNameExist({
      table: "services",
      check: "service_name",
      name,
      digital_twin_id,
    });

    if (isExistName) {
      const sql = `select * from services where service_name = '${name}' and digital_twin_id = '${digital_twin_id}';`;
      const selectedData = await model.postgres.selectDataS({ sql });
      return selectedData;
    } else {
      throw new ErrorHandler(
        412,
        412,
        "Unregistered services under search function"
      );
    }
  }

  /**
   * 저장된 모든 service의 이름 조회
   * @returns {List}
   */
  async getAll({ digital_twin_id }) {
    const sql = `select * from services where digital_twin_id = '${digital_twin_id}';`;
    const serviceEntireList = await model.postgres.selectDataS({ sql });

    return serviceEntireList;
  }

  /**
   * 저장된 service 조회
   * @param {string}
   * @returns {Json} {string}
   */
  async retrieve({ digital_twin_id, service_id }) {
    const isExistID = await model.postgres.checkIdExist({
      table: "services",
      check: "service_id",
      id: service_id,
      digital_twin_id,
    });
    // digitalObjects이 존재하면 조회
    if (isExistID) {
      const sql = `select * from services where service_id = '${service_id}' and digital_twin_id = '${digital_twin_id}';`;
      const selectedData = await model.postgres.selectData({ sql });
      return selectedData;
    } else {
      throw new ErrorHandler(
        412,
        412,
        "Unregistered services under retrieve function"
      );
    }
  }

  /**
   * service update
   * @param {String} service_id
   * @returns {Json}
   */
  async update({ digital_twin_id, service_id }, params) {
    const isExistID = await model.postgres.checkIdExist({
      table: "services",
      check: "service_id",
      id: service_id,
      digital_twin_id,
    });
    if (!isExistID) {
      throw new ErrorHandler(412, 412, "Unregistered services at FDT");
    } else {
      let sql = `UPDATE services SET `;
      let hasSetClause = false;
      for (let key in params) {
        if (key === "authorization") {
          sql += `${hasSetClause ? ", " : ""}"${key}" = '${params[key]}'`;
        } else if (key === "keywords" || key === "subjects") {
          sql += `${hasSetClause ? ", " : ""}${key} = '{${params[key]}}'`;
        } else if (
          //json type
          key === "preliminary_field" ||
          key === "service_request_param" ||
          key === "service_response_info" ||
          key === "error_info"
        ) {
          sql += `${hasSetClause ? ", " : ""}${key} = '${JSON.stringify(
            params[key]
          )}'`;
        } else {
          sql += `${hasSetClause ? ", " : ""}${key} = '${params[key]}'`;
        }
        hasSetClause = true;
      }
      sql += ` WHERE service_id = '${service_id}' and digital_twin_id = '${digital_twin_id}';`;
      await model.postgres.sendQuery({ sql });

      return { update: service_id };
    }
  }

  /**
   *  service 삭제
   * @param {string}
   * @returns {Json}
   */
  async delete({ digital_twin_id, service_id }) {
    const isExistID = await model.postgres.checkIdExist({
      table: "services",
      check: "service_id",
      id: service_id,
      digital_twin_id,
    });

    if (!isExistID) {
      throw new ErrorHandler(412, 412, "Unregistered service of FDT");
    } else {
      const sql = `delete from services where service_id = '${service_id}' and digital_twin_id = '${digital_twin_id}';`;
      await model.postgres.sendQuery({ sql });

      return { delete: service_id };
    }
  }
}

module.exports = Services;
