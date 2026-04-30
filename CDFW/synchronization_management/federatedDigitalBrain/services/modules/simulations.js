const Model = require("../../models");
const ErrorHandler = require("../../lib/error-handler");
const model = new Model();
const lib = require("../../lib");
const config = require("../../config");

// federated digital twin simulation part
class Simulations {
  /**
   * simulation create
   * @param {String} simulation_id (system)
   * @param {String} federated_digital_twin_id (required)
   * @param {String} simulation_name (required)
   * @param {String} description (required)
   * @param {String array} keywords (required)
   * @param {String} creation_time (system)
   * @param {String} creator_id (required)
   * @param {String} modification_time (system)
   * @param {String array} simulation_subject (required)
   * @param {String} simulation_access_url (required)
   * @param {String} authorization (required)
   * @param {JSON} simulation_request_param (required)
   * @param {JSON} simulation_response_info (required)
   * @param {String} response_format_type (required)
   * @param {String} interface_type (required)
   * @param {JSON} error_info (required)
   * @param {Integer} time_step (required)
   * @param {String} simulation_type (required)
   * @param {String array} simulation_attribute (optional)
   * @param {String} resource_type (required)
   * @param {String} include_input (required)
   * @param {Json} preliminary_field (optional)
   */
  async create(federated_digital_twin_id, params) {
    let simCount;
    const isExistDtId = await model.postgres.checkIdExist({
      table: "federated_digital_twins",
      check: "federated_digital_twin_id",
      id: federated_digital_twin_id,
    });
    if (!isExistDtId) {
      throw new ErrorHandler(412, 412, "Unregistered federated digital-twin");
    } else {
      const selectFDTsql = `select * from federated_digital_twins where federated_digital_twin_id = '${federated_digital_twin_id}'`;
      const selectedFDTdata = await model.postgres.selectData({
        sql: selectFDTsql,
      });
      simCount = parseInt(selectedFDTdata.number_of_simulations) + 1;
    }

    const {
      simulation_identifier,
      simulation_name,
      description,
      keywords,
      creator_id,
      simulation_subject,
      simulation_access_url,
      authorization,
      simulation_request_param,
      simulation_response_info,
      response_format_type,
      interface_type,
      error_info,
      time_step,
      simulation_type,
      simulation_attribute,
      resource_type,
      include_input,
      preliminary_field,
    } = params;

    let simulation_id = "FSIM" + (simulation_identifier || uuid());
    const isExistSIMid = await model.postgres.checkIdExist({
      table: "federated_simulations",
      check: "simulation_id",
      id: simulation_id,
      federated_digital_twin_id,
    });
    if (isExistSIMid) {
      throw new ErrorHandler(
        412,
        412,
        "federated_simulation_id already in use"
      );
    }
    let checkExistID;
    let existArr = [];
    if (resource_type == "federated_digital_object") {
      for (let item = 0; item < simulation_subject.length; item++) {
        checkExistID = await model.postgres.checkIdExist({
          table: "federated_digital_objects",
          check: "federated_digital_object_id",
          id: simulation_subject[item],
          federated_digital_twin_id,
        });
        existArr.push(checkExistID);
      }

      for (let i = 0; i < existArr.length; i++) {
        if (existArr[i] === false) {
          throw new ErrorHandler(
            412,
            412,
            `Unregistered federated-simulation_subject`
          );
        }
      }
    } else if (resource_type == "simulation") {
      for (let item = 0; item < simulation_subject.length; item++) {
        checkExistID = await model.postgres.checkIdExist({
          table: "federated_simulations",
          check: "simulation_id",
          id: simulation_subject[item],
          federated_digital_twin_id,
        });
        existArr.push(checkExistID);
      }

      for (let i = 0; i < existArr.length; i++) {
        if (existArr[i] === false) {
          throw new ErrorHandler(
            412,
            412,
            `Unregistered simulation_subject of FDT`
          );
        }
      }
    }

    const creationTime = lib.timestamp();

    const insertSimulationDataSQL = `insert into federated_simulations (
         simulation_id,
         federated_digital_twin_id,
         simulation_name,
         description,
         creation_time,
         creator_id,
         modification_time,
         simulation_subject,
         simulation_access_url,
         time_step,
         simulation_type,
         simulation_attribute,
         resource_type,
         include_input,
         keywords,
         "authorization",
         simulation_request_param,
         simulation_response_info,
         response_format_type,
         interface_type,
         error_info,
         preliminary_field,
         simulation_state
      ) values ('${simulation_id}', '${federated_digital_twin_id}', '${simulation_name}', '${description}', '${creationTime}', '${creator_id}', '${creationTime}', '{${simulation_subject}}', '${simulation_access_url}', '${time_step}', '${simulation_type}', '{${simulation_attribute}}', '${resource_type}', '${include_input}', '{${keywords}}', '${authorization}', '${JSON.stringify(
      simulation_request_param
    )}', '${JSON.stringify(
      simulation_response_info
    )}', '${response_format_type}', '${interface_type}', '${JSON.stringify(
      error_info
    )}', '${JSON.stringify(preliminary_field)}', 'off');`;
    await model.postgres.insertRelationInfo({
      parent_id: federated_digital_twin_id,
      resource_id: simulation_id,
      type: config.type.simulation,
    });

    const updatesimCountSQL = `update federated_digital_twins set number_of_simulations = ${simCount}, modification_time = '${lib.timestamp()}' where federated_digital_twin_id = '${federated_digital_twin_id}'`;
    await model.postgres.sendQuery({
      sql: insertSimulationDataSQL + updatesimCountSQL,
    });

    if (simulation_type == "default") {
      await model.kafka.createPostgresSinkConnector({
        topic: `${simulation_id}_result`,
        table: "federated_simulation_data",
        type: "simulation_result",
      });

      client.refreshMetadata([`${simulation_id}_result`], (err) => {
        if (err) {
          console.warn("Error refreshing kafka metadata", err);
        }
      });
    }

    return { simulation_id };
  }

  /**
   * 이름으로 저장된 simulation 검색
   * @param {string}
   * @returns {string}
   */
  async search({ federated_digital_twin_id, name }) {
    const isExistName = await model.postgres.checkNameExist({
      table: "federated_simulations",
      check: "simulation_name",
      name,
      federated_digital_twin_id,
    });

    if (isExistName) {
      const sql = `select * from federated_simulations where simulation_name = '${name}' and federated_digital_twin_id = '${federated_digital_twin_id}'`;
      const selectedData = await model.postgres.selectDataS({ sql });
      return selectedData;
    } else {
      throw new ErrorHandler(
        412,
        412,
        "Unregistered federated_simulations of FDT"
      );
    }
  }

  /**
   * 저장된 simulation 조회
   * @param {string}
   * @returns {Json} {string}
   */
  async retrieve({ federated_digital_twin_id, simulation_id }) {
    const isExistID = await model.postgres.checkIdExist({
      table: "federated_simulations",
      check: "simulation_id",
      id: simulation_id,
      federated_digital_twin_id,
    });
    // digitalObjects이 존재하면 조회
    if (isExistID) {
      const sql = `select * from federated_simulations where simulation_id = '${simulation_id}' and federated_digital_twin_id = '${federated_digital_twin_id}'`;
      const selectedData = await model.postgres.selectData({ sql });
      return selectedData;
    } else {
      throw new ErrorHandler(
        412,
        412,
        "Unregistered federated_simulations of FDT"
      );
    }
  }

  /**
   * simulation update
   * @param {String} simulation_id (system)
   * @param {String} simulation_name (required)
   * @param {String} description (required)
   * @param {String} creation_time (system)
   * @param {String} creator_id (required)
   * @param {String} modification_time (system)
   * @param {String array} simulation_subject (required)
   * @param {String} simulation_access_url (required)
   * @param {Integer} time_step (required)
   * @param {String} simulation_type (required)
   * @param {String array} simulation_attribute (optional)
   * @param {String} resource_type (required)
   * @param {String} include_input (required)
   * @returns {Json}
   */
  async update({ federated_digital_twin_id, simulation_id }, params) {
    const isExistID = await model.postgres.checkIdExist({
      table: "federated_simulations",
      check: "simulation_id",
      id: simulation_id,
      federated_digital_twin_id,
    });

    if (!isExistID) {
      throw new ErrorHandler(
        412,
        412,
        "Unregistered federated_simulations of FDT"
      );
    }

    let checkExistID;
    if (params.simulation_subject) {
      for (const subject of params.simulation_subject) {
        if (subject.startsWith("FD")) {
          checkExistID = await model.postgres.checkIdExist({
            table: "federated_digital_objects",
            check: "federated_digital_object_id",
            id: subject,
            federated_digital_twin_id,
          });
          if (!checkExistID) {
            throw new ErrorHandler(
              412,
              412,
              `Unregistered simulation_subject (digital_object)`
            );
          }
        } else {
          checkExistID = await model.postgres.checkIdExist({
            table: "federated_simulations",
            check: "simulation_id",
            id: subject,
            federated_digital_twin_id,
          });
          if (!checkExistID) {
            throw new ErrorHandler(
              412,
              412,
              `Unregistered simulation_subject (simulation)`
            );
          }
        }
      }
    }

    const updateFields = Object.entries(params)
      .map(([key, value]) => {
        if (
          key === "simulation_subject" ||
          key === "simulation_attribute" ||
          key === "keywords"
        ) {
          return `${key} = '{${value}}'`;
        } else if (
          key === "simulation_request_param" ||
          key === "simulation_response_info" ||
          key === "error_info" ||
          key === "preliminary_field"
        ) {
          return `${key} = '${JSON.stringify(value)}'`;
        } else if (key === "time_step") {
          return `${key} = ${value}`;
        } else if (key === "authorization") {
          return `"${key}" = '${value}'`;
        } else if (value !== undefined) {
          return `${key} = '${value}'`;
        }
        return null;
      })
      .filter((field) => field !== null)
      .join(", ");

    const sql = `UPDATE federated_simulations SET ${updateFields}, modification_time='${lib.timestamp()}' WHERE simulation_id = '${simulation_id}' AND federated_digital_twin_id = '${federated_digital_twin_id}'`;

    await model.postgres.sendQuery({ sql });

    if (
      params.simulation_subject ||
      params.time_step ||
      params.simulation_type ||
      params.resource_type ||
      params.include_input
    ) {
      await this.execute({
        federated_digital_twin_id,
        simulation_id,
        caseOfcreate: "put",
      });
    }

    return { update: simulation_id };
  }

  /**
   *  simulation 삭제
   * @param {string}
   * @returns {Json}
   */
  async delete({ federated_digital_twin_id, simulation_id }) {
    const isExistID = await model.postgres.checkIdExist({
      table: "federated_simulations",
      check: "simulation_id",
      id: simulation_id,
      federated_digital_twin_id,
    });
    if (!isExistID) {
      throw new ErrorHandler(412, 412, "Unregistered simulation in FDT");
    } else {
      const selectFDTsql = `SELECT * FROM federated_digital_twins WHERE federated_digital_twin_id = '${federated_digital_twin_id}'`;
      const selectedFDTdata = await model.postgres.selectData({
        sql: selectFDTsql,
      });

      const simCount = parseInt(selectedFDTdata.number_of_simulations) - 1;

      // Combine SQL operations into a single query
      const sql = `
            DELETE FROM relations WHERE resource_id = '{${simulation_id}}';
            DELETE FROM federated_simulations WHERE simulation_id = '${simulation_id}' AND federated_digital_twin_id = '${federated_digital_twin_id}';
            DELETE FROM federated_simulation_data WHERE simulation_id = '${simulation_id}';
            UPDATE federated_digital_twins SET number_of_simulations = ${simCount}, modification_time = '${lib.timestamp()}' WHERE federated_digital_twin_id = '${federated_digital_twin_id}';
         `;

      await model.postgres.sendQuery({ sql });

      // Parallelize Kafka deletion
      const kafkaPromises = [
        model.kafka.deleteSink({
          connectorName: simulation_id,
        }),
        model.kafka.deleteSink({
          type: "DigitalBase_",
          connectorName: `${simulation_id}_result`,
        }),
      ];

      await Promise.all(kafkaPromises);

      return { delete: simulation_id };
    }
  }

  /*
   * @param {string}
   * @returns {Json}
   */
  async execute({ federated_digital_twin_id, simulation_id, caseOfcreate }) {
    const selectedData = await model.postgres.selectData({
      sql: `SELECT * FROM federated_simulations WHERE simulation_id = '${simulation_id}' AND federated_digital_twin_id = '${federated_digital_twin_id}'`,
    });

    if (selectedData) {
      const {
        simulation_name,
        simulation_subject,
        simulation_access_url,
        simulation_attribute,
        time_step,
        resource_type,
        include_input,
      } = selectedData;

      const str_simulation_subject = lib.arryToString(simulation_subject);
      let str_simulation_attribute = lib.arryToString(simulation_attribute);

      if (!str_simulation_attribute) {
        str_simulation_attribute = "";
      }

      // Check and create/update Kafka sink connectors concurrently
      const kafkaPromises = [];

      if (caseOfcreate) {
        // Update Kafka sink connector
        kafkaPromises.push(
          model.kafka.updateSimulationSinkConnector({
            digital_twin_id: federated_digital_twin_id,
            simulation_id,
            simulation_name,
            simulation_subject: str_simulation_subject,
            simulation_access_url,
            simulation_attribute: str_simulation_attribute,
            time_step,
            resource_type,
            include_input,
          })
        );
      } else {
        // Create Kafka sink connector
        kafkaPromises.push(
          model.kafka.createSimulationSinkConnector({
            digital_twin_id: federated_digital_twin_id,
            simulation_id,
            simulation_name,
            simulation_subject: str_simulation_subject,
            simulation_access_url,
            simulation_attribute: str_simulation_attribute,
            time_step,
            resource_type,
            include_input,
          })
        );

        // Create Postgres sink connector
        kafkaPromises.push(
          model.kafka.createPostgresSinkConnector({
            topic: `${simulation_id}_result`,
            table: "federated_simulation_data",
            type: "simulation_result",
          })
        );
      }

      await Promise.all(kafkaPromises);

      return { execute: simulation_id };
    } else {
      throw new ErrorHandler(
        412,
        412,
        "Unregistered federated_simulations of execute in FDT"
      );
    }
  }

  /**
   *  simulation 데이터 피딩 중지
   * @param {string}
   * @returns {Json}
   */
  async termination({ federated_digital_twin_id, simulation_id }) {
    const isExistID = await model.postgres.checkIdExist({
      table: "federated_simulations",
      check: "simulation_id",
      id: simulation_id,
      federated_digital_twin_id,
    });

    if (!isExistID) {
      throw new ErrorHandler(
        412,
        412,
        "Unregistered federated_simulations of FDT"
      );
    }

    const updateSQL = `
         UPDATE federated_simulations
         SET simulation_state = 'off'
         WHERE simulation_id = '${simulation_id}' AND federated_digital_twin_id = '${federated_digital_twin_id}';
      `;

    await model.postgres.sendQuery({ sql: updateSQL });

    await model.kafka.connectorOperation({
      name: `SIM${simulation_id}`,
      action: "pause",
    });

    return { termination: simulation_id };
  }

  /**
   *  simulation Resume
   * @param {string}
   * @returns {Json}
   */
  async resume({ federated_digital_twin_id, simulation_id }) {
    const isExistID = await model.postgres.checkIdExist({
      table: "federated_simulations",
      check: "simulation_id",
      id: simulation_id,
      federated_digital_twin_id,
    });

    if (!isExistID) {
      throw new ErrorHandler(
        412,
        412,
        "Unregistered federated_simulations of FDT"
      );
    }

    const updateSQL = `
         UPDATE federated_simulations
         SET simulation_state = 'on'
         WHERE simulation_id = '${simulation_id}' AND federated_digital_twin_id = '${federated_digital_twin_id}';
      `;

    await model.postgres.sendQuery({ sql: updateSQL });

    const selectedData = await model.postgres.selectData({
      sql: `SELECT * FROM federated_simulations WHERE simulation_id = '${simulation_id}' AND federated_digital_twin_id = '${federated_digital_twin_id}'`,
    });

    await model.kafka.connectorOperation({
      name: `SIM${selectedData.simulation_id}`,
      action: "resume",
    });

    return { resume: simulation_id };
  }

  /**
   *  simulation dataCreate
   * @param {string}
   * @returns {Json}
   */
  async dataCreate({ federated_digital_twin_id, simulation_id }, body) {
    const isExistID = await model.postgres.checkIdExist({
      table: "federated_simulations",
      check: "simulation_id",
      id: simulation_id,
      federated_digital_twin_id,
    });

    if (isExistID) {
      const sql = `select * from federated_simulations where simulation_id = '${simulation_id}' and federated_digital_twin_id = '${federated_digital_twin_id}'`;
      const selectedData = await model.postgres.selectData({ sql });
      const {
        simulation_name,
        simulation_subject,
        simulation_access_url,
        simulation_attribute,
      } = selectedData;

      const trigger_time = lib.timestamp();
      const simulationBody = {
        rowtime: trigger_time,
        simulation_id,
        federated_digital_twin_id,
        simulation_name,
        simulation_subject,
        simulation_attribute,
        input_data: body,
      };

      const result = await lib.request({
        url: simulation_access_url,
        bodyParams: simulationBody,
      });

      const jsonResult = result.data
        ? JSON.stringify(result.data)
        : JSON.stringify(result);
      const simulationResultBody = {
        simulation_id,
        simulation_data_id: `FSD${uuid()}`,
        trigger_time,
        result_time: lib.timestamp(),
        input_data: JSON.stringify(body),
        result_data: jsonResult,
      };

      const kafkaKey = { simulation_id };
      model.kafka.kafkaProducer({
        topic: `${simulation_id}_result`,
        kafkaKey: JSON.stringify(kafkaKey),
        data: JSON.stringify(simulationResultBody),
      }); //string

      return { dataCreate: simulation_id };
    } else {
      return "Unregistered simulation of dataCreate in FDT";
    }
  }

  /**
   *  simulation result asynchronous input
   * @param {string}
   * @returns {Json}
   */
  async resultAsyncUpdate({
    federated_digital_twin_id,
    simulation_id,
    simulation_data_id,
    result_data,
  }) {
    const isExistSimulationID = await model.postgres.checkIdExist({
      table: "federated_simulations",
      check: "simulation_id",
      id: simulation_id,
      federated_digital_twin_id,
    });

    const isExistSimulationDataID = await model.postgres.checkIdExist({
      table: "federated_simulation_data",
      check: "simulation_data_id",
      id: simulation_data_id,
    });
    // simulation이 존재하면 조회
    if (isExistSimulationID) {
      if (isExistSimulationDataID) {
        let sql = `update federated_simulation_data set result_data='${JSON.stringify(
          result_data
        )}', result_time='${lib.timestamp()}' where simulation_id = '${simulation_id}' and simulation_data_id = '${simulation_data_id}'`;

        await model.postgres.sendQuery({ sql });

        return { simulation_data_id };
      } else {
        return "Unregistered simulation_data";
      }
    } else {
      return "Unregistered simulation";
    }
  }

  /**
   *  simulation dataRetrieve
   * @param {string}
   * @returns {Json}
   */
  async dataRetrieve({
    federated_digital_twin_id,
    simulation_id,
    from,
    to,
    count,
  }) {
    const isExistID = await model.postgres.checkIdExist({
      table: "federated_simulations",
      check: "simulation_id",
      id: simulation_id,
      federated_digital_twin_id,
    });

    if (!isExistID) {
      throw new ErrorHandler(
        412,
        412,
        "Unregistered simulation of dataRetrieve in FDT"
      );
    }

    if (from && to) {
      const sql = `SELECT * FROM federated_simulation_data WHERE simulation_id = '${simulation_id}' AND trigger_time >= '${from}'::timestamp AND trigger_time <= '${to}'::timestamp;`;
      const retrievedData = await model.postgres.selectDataS({ sql });
      return retrievedData;
    } else if (count) {
      const sql = `SELECT * FROM federated_simulation_data WHERE simulation_id = '${simulation_id}' order by trigger_time desc limit ${count};`;
      const retrievedData = await model.postgres.selectDataS({ sql });
      return retrievedData;
    } else {
      const sql = `SELECT * FROM federated_simulation_data WHERE simulation_id = '${simulation_id}' order by trigger_time desc limit 100;`;
      const retrievedData = await model.postgres.selectDataS({ sql });
      return retrievedData;
    }
  }

  /**
   * 저장된 모든 federated_simulations의 이름 조회
   * @returns {List}
   */
  async getAll({ federated_digital_twin_id }) {
    const sql = `select * from federated_simulations where federated_digital_twin_id = '${federated_digital_twin_id}';`;
    const simulationEntireList = await model.postgres.selectDataS({ sql });

    return simulationEntireList;
  }
}

module.exports = Simulations;
