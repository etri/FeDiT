const Model = require("../../models");
const model = new Model();
const config = require("../../config");
const ErrorHandler = require("../../lib/error-handler");
const lib = require("../../lib/index");

class FederatedDigitalTwins {
  /**
   * federatedDigitalTwin create
   * @param {String} federated_digital_twin_name (required)
   * @param {String} description (required) //필요성 검토
   * @param {String array} keywords (required)
   * @param {String} point_of_access (required)
   * @param {String} creator_id (required)
   * @param {String} owner (required)
   * @param {JSON} location (optional)
   * @returns {Boolean} true
   */

  async create(params) {
    const {
      federated_digital_twin_identifier,
      federated_digital_twin_name,
      description,
      owner,
      keywords,
      point_of_access,
      creator_id,
      location,
    } = params;

    let federated_digital_twin_id =
      federated_digital_twin_identifier || "FDT" + uuid();
    const isExistDtId = await model.postgres.checkIdExist({
      table: "federated_digital_twins",
      check: "federated_digital_twin_id",
      id: federated_digital_twin_id,
    });
    if (isExistDtId) {
      throw new ErrorHandler(
        412,
        412,
        "federated_digital_twin_id already in use"
      );
    }

    const creation_time = lib.timestamp();

    const sql = `insert into federated_digital_twins (
         federated_digital_twin_id,
         federated_digital_twin_name,
         description,
         owner,
         keywords,
         point_of_access,
         creation_time,
         creator_id,
         modification_time,
         location,
         number_of_federated_digital_objects,
         number_of_subscriptions,
         number_of_services,
         number_of_simulations,
         number_of_digital_twins,
         number_of_visual_models
      ) values ('${federated_digital_twin_id}', '${federated_digital_twin_name}',  '${description}', '${owner}', '{${keywords}}', '${point_of_access}', '${creation_time}',
       '${creator_id}', '${creation_time}', '${JSON.stringify(
      location
    )}', 0, 0, 0, 0, 0, 0);`;

    await model.postgres.sendQuery({ sql });

    return { federated_digital_twin_id };
  }

  /**
   * federated digitalTwin metaData export
   * @param {string} name
   * @returns {Json}
   */
  async Export({ federated_digital_twin_id }) {
    const isExistID = await model.postgres.checkIdExist({
      table: "federated_digital_twins",
      check: "federated_digital_twin_id",
      id: federated_digital_twin_id,
    });

    const resourceArr = [
      "digital_twins",
      "federated_digital_objects",
      "federated_data_models",
      "federated_fidelitys",
      "federated_services",
      "federated_simulations",
      "federated_subscriptions",
      "federated_validations",
      "federated_visual_models",
    ];

    if (isExistID) {
      const sql = `select * from federated_digital_twins where federated_digital_twin_id = '${federated_digital_twin_id}'`;
      const TwinResource = await model.postgres.selectData({ sql });
      let getAllResourceSQL = ``;
      for (const i in resourceArr) {
        getAllResourceSQL += `select * from ${resourceArr[i]} where federated_digital_twin_id = '${federated_digital_twin_id}'; `;
      }
      const resources = await model.postgres.select({
        sql: getAllResourceSQL,
      });

      for (let i = 0; i < resources.length; i++) {
        const rows = resources[i].rows;
        TwinResource[resourceArr[i]] = rows;
      }
      return TwinResource;
    } else {
      throw new ErrorHandler(412, 412, "Unregistered federated-digital-twin");
    }
  }

  /**
   * 저장된 federated digitalTwin 조회
   * @param {string} name
   * @returns {Json}
   */
  async Retrieve({ federated_digital_twin_id }) {
    const isExistID = await model.postgres.checkIdExist({
      table: "federated_digital_twins",
      check: "federated_digital_twin_id",
      id: federated_digital_twin_id,
    });
    // federated digitalTwin이 존재하면 조회
    if (isExistID) {
      const sql = `select * from federated_digital_twins where federated_digital_twin_id = '${federated_digital_twin_id}'`;
      const selectedData = await model.postgres.selectData({ sql });
      return selectedData;
    } else {
      throw new ErrorHandler(412, 412, "Unregistered federated-digital-twin ");
    }
  }

  /**
   * 저장된 federated digitalTwin 검색
   * @param {string} name
   * @returns {Json}
   */
  async Search({ name }) {
    const isExistName = await model.postgres.checkNameExist({
      table: "federated_digital_twins",
      check: "federated_digital_twin_name",
      name,
    });

    if (isExistName) {
      const sql = `select * from federated_digital_twins where federated_digital_twin_name = '${name}'`;
      const selectedData = await model.postgres.selectDataS({ sql });
      return selectedData;
    } else {
      throw new ErrorHandler(412, 412, "Unregistered federated-digital-twin");
    }
  }

  /**
   * federated digitalTwin update
   * @param
   * @returns {Boolean} true
   */
  async update(federated_digital_twin_id, params) {
    const isExistID = await model.postgres.checkIdExist({
      table: "federated_digital_twins",
      check: "federated_digital_twin_id",
      id: federated_digital_twin_id,
    });
    // federated digitalTwin이 존재하면 조회
    if (!isExistID) {
      throw new ErrorHandler(412, 412, "Unregistered federated-digital-twin");
    } else {
      const modification_time = lib.timestamp();
      let sql = `update federated_digital_twins set `;
      for (let key in params) {
        if (key === "location") {
          sql += `${key} = '${JSON.stringify(params[key])}', `;
        } else if (key === "keywords") {
          sql += `${key} = '{${params[key]}}', `;
        } else {
          sql += `${key} = '${params[key]}', `;
        }
      }
      sql += ` modification_time='${modification_time}' where federated_digital_twin_id = '${federated_digital_twin_id}'`;
      await model.postgres.sendQuery({ sql });

      return { update: federated_digital_twin_id };
    }
  }

  /**
   *  federated digitalTwin 삭제
   * @param {string} name
   * @returns {Json}
   */
  async delete({ id }) {
    const isExistID = await model.postgres.checkIdExist({
      table: "federated_digital_twins",
      check: "federated_digital_twin_id",
      id,
    });

    if (isExistID) {
      const selectSIMsql = `SELECT * FROM federated_simulations WHERE federated_digital_twin_id = '${id}'`;
      const selectedSIMs = await model.postgres.selectDataS({
        sql: selectSIMsql,
      });

      for (const selectedSIM of selectedSIMs) {
        await model.kafka.deleteSink({
          connectorName: `${selectedSIM.simulation_id}`,
        });

        await model.kafka.deleteSink({
          connectorName: `DigitalBase_${selectedSIM.simulation_id}_result`,
        });
      }

      const selectSUBsql = `SELECT * FROM federated_subscriptions WHERE federated_digital_twin_id = '${id}'`;
      const selectedSUBs = await model.postgres.selectDataS({
        sql: selectSUBsql,
      });

      for (const selectedSUB of selectedSUBs) {
        await model.kafka.deleteSink({
          connectorName: `${selectedSUB.subscription_id}`,
        });
      }
      const sql = `delete from federated_digital_twins where federated_digital_twin_id = '${id}';
           delete from relations where resource_id = '{${id}}' or parent_id = '${id}';
           delete from federated_digital_objects where federated_digital_twin_id = '${id}';
           delete from federated_digital_object_data where federated_digital_twin_id = '${id}';
           delete from federated_services where federated_digital_twin_id = '${id}';
           delete from federated_subscriptions where federated_digital_twin_id = '${id}';
           delete from federated_simulations where federated_digital_twin_id = '${id}';
           delete from federated_data_models where federated_digital_twin_id = '${id}';
           delete from federated_visual_models where federated_digital_twin_id = '${id}';
           delete from federated_validations where federated_digital_twin_id = '${id}';
           delete from federated_fidelities where federated_digital_twin_id = '${id}';
           delete from fdo_compositions where federated_digital_twin_id = '${id}';
           delete from fdo_sync_compositions where federated_digital_twin_id = '${id}';`;
      await model.postgres.sendQuery({ sql });

      return { delete: id };
    } else {
      throw new ErrorHandler(412, 412, "Unregistered federated-digital-twin");
    }
  }

  /**
   * 저장된 모든 federated-digitalTwin의 이름 조회
   * @returns {List}
   */
  async getAll() {
    const sql = `select * from federated_digital_twins`;
    const DTentireList = await model.postgres.selectDataS({ sql });

    return DTentireList;
  }

  /**
   * federated digital object의 control execution result data 생성 -> kafka (fdo_control_result)
   * @param {string} digital_object_id
   * @param {string} federated_digital_object_control_data_id
   * @param {Json Array} execution_result
   *
   * @returns {Json}
   */
  async createFDOExecutionData(params) {
    const control_execution_time = lib.timestamp();
    const {
      federated_digital_object_control_data_id,
      digital_object_id,
      control_execution_result,
    } = params;

    const isExistID = await model.postgres.checkIdExist({
      table: "federated_controls",
      check: "federated_digital_object_control_data_id",
      id: federated_digital_object_control_data_id,
    });

    if (!isExistID) {
      throw new ErrorHandler(
        412,
        412,
        "Unregistered federated_digital_object_control_data_id"
      );
    }

    let sql = `SELECT federated_digital_object_id FROM federated_controls where federated_digital_object_control_data_id = '${federated_digital_object_control_data_id}' `;
    let selectResult = await model.postgres.selectData({ sql });
    let federated_digital_object_id = selectResult.federated_digital_object_id;
    let fdoExecutionResultMessage = {
      federated_digital_object_id,
      digital_object_id,
      federated_digital_object_control_data_id,
      control_execution_result,
      control_execution_time,
    };
    console.log(fdoExecutionResultMessage);

    const kafkaKey = { federated_digital_object_id };
    await model.kafka.kafkaProducer({
      topic: "fdo_control_result",
      kafkaKey: JSON.stringify(kafkaKey),
      data: JSON.stringify(fdoExecutionResultMessage),
    });

    return { federated_digital_object_control_data_id };
  }
}

module.exports = FederatedDigitalTwins;
