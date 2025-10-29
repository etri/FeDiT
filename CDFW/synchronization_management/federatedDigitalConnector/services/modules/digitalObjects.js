const ErrorHandler = require("../../lib/error-handler");
const lib = require("../../lib/index");
const config = require("../../config");
const Model = require("../../models");
const model = new Model();
const { stringify } = require("wkt");
const axios = require("axios");

class DigitalObjects {
  /**
   * [POST] digital_object
   * @returns {Json} {}
   */
  async create(digital_twin_id, params) {
    const isExistDtId = await model.postgres.checkIdExist({
      table: "digital_twins",
      check: "digital_twin_id",
      id: digital_twin_id,
    });
    if (!isExistDtId) {
      throw new ErrorHandler(412, 412, "Unregistered digital_twin");
    }

    let digital_object_id = params.digital_object_identifier || "DO" + uuid();

    const isExistDOid = await model.postgres.checkIdExist({
      table: "digital_objects",
      check: "digital_object_id",
      id: digital_object_id,
    });
    if (isExistDOid) {
      throw new ErrorHandler(
        412,
        412,
        "digital_object_identifier already in use"
      );
    }

    const formattedCreationTime = await this.formatTime(params.creation_time);
    const formattedModificationTime = await this.formatTime(
      params.modification_time
    );
    if (
      params.digital_object_data_source_base_url &&
      params.digital_object_data_source_base_url.endsWith("/")
    ) {
      params.digital_object_data_source_base_url =
        params.digital_object_data_source_base_url.replace(/\/$/, "");
    }
    if (params.digital_object_data_source_type === "POLL") {
      await this.handlePollType(params, digital_twin_id, digital_object_id);
    }

    const sql = await this.buildInsertSQL(
      digital_twin_id,
      digital_object_id,
      params,
      formattedCreationTime,
      formattedModificationTime
    );
    await model.postgres.sendQuery({ sql });

    return { digital_object_id };
  }

  async checkIdExist({ table, check, id, digital_twin_id, errorMessage }) {
    const params = { table, check, id };

    if (digital_twin_id) {
      params.digital_twin_id = digital_twin_id;
    }

    const isExist = await model.postgres.checkIdExist(params);

    if (!isExist) {
      throw new ErrorHandler(412, 412, errorMessage);
    }
    return;
  }

  async formatTime(time) {
    return time ? `'${time}'` : null;
  }

  async buildInsertSQL(
    digital_twin_id,
    digital_object_id,
    params,
    creation_time,
    modification_time
  ) {
    return `INSERT INTO digital_objects (
         digital_twin_id,
         digital_object_id,
         digital_object_name,
         description,
         keywords,
         subjects,
         creation_time,
         modification_time,
         digital_object_data_access_type,
         digital_object_data_source_type,
         digital_object_data_source_base_url,
         digital_object_data_source_url,
         digital_object_data_access_url,
         digital_object_control_url,
         digital_object_data_model,
         digital_object_data_interval,
         digital_object_control_request_model,
         do_metadata,
         preliminary_field
         ) VALUES (
            '${digital_twin_id}',
            '${digital_object_id}',
            '${params.digital_object_name}',
            '${params.description}',
            '{${params.keywords}}',
            '{${params.subjects}}',
            ${creation_time},
            ${modification_time},
            '${params.digital_object_data_access_type}',
            '${params.digital_object_data_source_type}',
            '${params.digital_object_data_source_base_url}',
            '${params.digital_object_data_source_url}',
            '${params.digital_object_data_access_url}',
            '${params.digital_object_control_url}',
            '${JSON.stringify(params.digital_object_data_model)}',
            ${params.digital_object_data_interval},
            '${JSON.stringify(params.digital_object_control_request_model)}',
            '${JSON.stringify(params.do_metadata)}',
            '${JSON.stringify(params.preliminary_field)}'
         );`;
  }

  async handlePollType(params, digital_twin_id, digital_object_id) {
    let base_url = params.digital_object_data_source_base_url;
    let source_url = params.digital_object_data_source_url;
    let poll_interval = params.digital_object_data_interval;

    if (params.digital_object_data_access_type == "http") {
      if (!source_url) {
        throw new ErrorHandler(
          412,
          412,
          "When the digital_object_data_source_type is set to POLL the digital_object_data_source_url is required"
        );
      }

      if (!source_url.startsWith("http")) {
        throw new ErrorHandler(
          412,
          412,
          "Check that the digital_object_data_source_url starts with 'http://'."
        );
      }

      // digital_object_data_source_url 중복 체크
      const checkUrlSQL = `SELECT digital_object_id FROM digital_objects WHERE digital_object_data_source_url = '${source_url}'`;

      const doWithSameUrl = await model.postgres.selectData({
        sql: checkUrlSQL,
      });
      if (doWithSameUrl && doWithSameUrl.digital_object_id) {
        throw new ErrorHandler(
          412,
          412,
          `digital_object_data_source_url "${source_url}" is already registered by digital_object_id: ${doWithSameUrl.digital_object_id}`
        );
      }
      // 실제 연결 가능한 URL인지 체크
      try {
        const resp = await axios.get(source_url, { timeout: 5000 }); // 5초 제한
        if (resp.status < 200 || resp.status >= 400) {
          throw new Error();
        } else {
          console.log(
            `digital_object_data_source_url "${source_url}" is reachable.response.status: ${resp.status}`
          );
        }
      } catch (e) {
        throw new ErrorHandler(
          412,
          412,
          `digital_object_data_source_url "${source_url}" is not reachable or invalid (HTTP connection failed)`
        );
      }

      if (base_url) {
        if (!source_url.startsWith(base_url)) {
          throw new ErrorHandler(
            412,
            412,
            "Check that digital_object_data_source_base_url starts with digital_object_data_source_url."
          );
        }
        base_url = base_url.replace(/\/$/, "");
        const existingConnector = await model.postgres.selectData({
          sql: `SELECT distinct(connector_id) FROM connectors WHERE base_url = '${base_url}' and poll_interval = '${poll_interval}' and change_url is not null;`,
        });

        const changeUrl = source_url.replace(base_url, "");

        if (existingConnector.connector_id) {
          await this.updateExistingConnector(
            base_url,
            existingConnector,
            digital_twin_id,
            digital_object_id,
            changeUrl,
            poll_interval
          );
        } else {
          await this.createNewConnector(
            base_url,
            digital_twin_id,
            digital_object_id,
            changeUrl,
            poll_interval
          );
        }
      } else {
        await this.createNewConnector(
          source_url,
          digital_twin_id,
          digital_object_id,
          "",
          poll_interval
        );
      }
    }

    return;
  }

  async findExistingConnector(base_url, interval) {
    if (!base_url) return null;
    const sql = `SELECT distinct(connector_id) FROM connectors WHERE base_url = '${base_url}' and poll_interval = '${interval}' and change_url is not null;`;

    return await model.postgres.selectData({ sql });
  }

  async updateExistingConnector(
    base_url,
    existingConnector,
    digital_twin_id,
    digital_object_id,
    changeUrl,
    interval
  ) {
    const connector = await model.kafka.GetConnectorConfig({
      connector_id: `${existingConnector.connector_id}`,
    });

    if (connector) {
      const updatedChangeUrls = `${connector["api.change.url"]},${changeUrl}`;
      const updatedTwinIds = `${connector["digital.twin.id"]},${digital_twin_id}`;
      const updatedObjectIds = `${connector["digital.object.id"]},${digital_object_id}`;
      const baseUrl = connector["api.base.url"];

      await model.kafka.updateSourceHttpConnectorGroup({
        name: `${existingConnector.connector_id}`,
        base_url: baseUrl,
        change_urls: updatedChangeUrls,
        digital_object_ids: updatedObjectIds,
        digital_twin_ids: updatedTwinIds,
        digital_object_data_interval: interval,
      });

      const insertConnectorSQL = `INSERT INTO connectors (connector_id, base_url, poll_interval, digital_object_id, digital_twin_id, change_url) VALUES (
            '${existingConnector.connector_id}', '${baseUrl}', ${interval}, 
            '${digital_object_id}', '${digital_twin_id}', '${changeUrl}'
         )`;
      await model.postgres.sendQuery({ sql: insertConnectorSQL });
    } else {
      await this.createNewConnector(
        base_url,
        digital_twin_id,
        digital_object_id,
        changeUrl,
        interval
      );
    }
    return;
  }

  async createNewConnector(
    base_url,
    digital_twin_id,
    digital_object_id,
    changeUrl,
    interval
  ) {
    const newConnectorId = `HttpSource${uuid()}`;
    const insertConnectorSQL = `INSERT INTO connectors (connector_id, base_url, poll_interval, digital_object_id, digital_twin_id, change_url) VALUES (
         '${newConnectorId}', '${base_url}', ${interval}, 
         '${digital_object_id}', '${digital_twin_id}', '${changeUrl}'
      )`;
    await model.postgres.sendQuery({ sql: insertConnectorSQL });

    await model.kafka.createSourceHttpConnectorGroup({
      name: newConnectorId,
      base_url,
      change_urls: changeUrl,
      digital_object_ids: digital_object_id,
      digital_twin_ids: digital_twin_id,
      digital_object_data_interval: interval,
    });
    return;
  }

  /**
   * [PATCH] digital_object
   * @returns
   */
  async update({ digital_twin_id, digital_object_id }, params) {
    const selectSQL = `SELECT * FROM digital_objects WHERE digital_object_id = '${digital_object_id}' AND digital_twin_id = '${digital_twin_id}'`;
    const selectedData = await model.postgres.selectData({ sql: selectSQL });
    if (!selectedData) {
      throw new ErrorHandler(
        404,
        404,
        `Unregistered digital_object ${digital_object_id}`
      );
    }

    const dataSourceType = selectedData.digital_object_data_source_type;
    const dataAccessType = params.digital_object_data_access_type
      ? params.digital_object_data_access_type
      : selectedData.digital_object_data_access_type;

    // POLL / PUSH 타입만 커넥터 관리 대상
    if (["POLL", "PUSH"].includes(dataSourceType)) {
      if (
        params.digital_object_data_source_base_url ||
        params.digital_object_data_source_url ||
        params.digital_object_data_interval
      ) {
        // 기존값과 비교하여 변경여부 판단
        const isBaseUrlChanged =
          params.digital_object_data_source_base_url &&
          params.digital_object_data_source_base_url !==
            selectedData.digital_object_data_source_base_url;

        const isSourceUrlChanged =
          params.digital_object_data_source_url &&
          params.digital_object_data_source_url !==
            selectedData.digital_object_data_source_url;

        const isIntervalChanged =
          params.digital_object_data_interval &&
          params.digital_object_data_interval !=
            selectedData.digital_object_data_interval;

        // 변경이 하나도 없으면 커넥터 로직 스킵
        if (!isBaseUrlChanged && !isSourceUrlChanged && !isIntervalChanged) {
          console.log(
            `[update] No change detected in base_url/source_url/interval, skipping connector update.`
          );
          await this.updateDigitalObject(
            digital_twin_id,
            digital_object_id,
            params
          );
          return { update: digital_object_id };
        }

        // URL 접근 가능성 검증
        if (isSourceUrlChanged && params.digital_object_data_source_url) {
          try {
            const response = await axios.get(
              params.digital_object_data_source_url,
              { timeout: 5000 }
            );
            if (response.status < 200 || response.status >= 400) {
              throw new Error();
            }
            console.log(
              `[update] Verified reachable URL: ${params.digital_object_data_source_url}`
            );
          } catch (err) {
            throw new ErrorHandler(
              412,
              412,
              `digital_object_data_source_url "${params.digital_object_data_source_url}" is not reachable or invalid (HTTP connection failed)`
            );
          }
        }

        if (dataAccessType != "http") {
          await this.updateDigitalObject(
            digital_twin_id,
            digital_object_id,
            params
          );

          return { update: digital_object_id };
        }

        await this.validateParams(params, selectedData);

        if (dataSourceType === "POLL") {
          const connectorData = await this.getConnectorData(
            digital_twin_id,
            digital_object_id
          );
          if (connectorData.connector_id) {
            // 이미 커넥터 존재 시 업데이트 or 삭제
            await this.updateOrDeleteConnector(
              connectorData,
              digital_object_id,
              digital_twin_id,
              selectedData,
              params
            );
          } else {
            // 새 커넥터 생성
            await this.createOrUpdateConnector(
              params.digital_object_data_source_base_url,
              params.digital_object_data_source_url,
              params.digital_object_data_interval,
              selectedData,
              digital_twin_id,
              digital_object_id
            );
          }
          // PUSH 타입 처리
        } else if (dataSourceType === "PUSH") {
          if (
            !params.digital_object_data_source_type ||
            params.digital_object_data_source_type != "POLL"
          ) {
            throw new ErrorHandler(
              412,
              412,
              "Check the digital_object_data_source_type."
            );
          }
          await this.createOrUpdateConnector(
            params.digital_object_data_source_base_url,
            params.digital_object_data_source_url,
            params.digital_object_data_interval,
            selectedData,
            digital_twin_id,
            digital_object_id
          );
        }
      }
    }
    // 최종 디지털 오브젝트 업데이트

    await this.updateDigitalObject(digital_twin_id, digital_object_id, params);

    return { update: digital_object_id };
  }

  async validateParams(params, selectedData) {
    if (
      params.digital_object_data_source_url &&
      !params.digital_object_data_source_url.startsWith("http")
    ) {
      throw new ErrorHandler(
        412,
        412,
        "Check that the digital_object_data_source_url starts with 'http://'."
      );
    }
    if (params.digital_object_data_source_url) {
      if (
        params.digital_object_data_source_base_url &&
        !params.digital_object_data_source_url.startsWith(
          params.digital_object_data_source_base_url
        )
      ) {
        throw new ErrorHandler(
          412,
          412,
          "Check that digital_object_data_source_base_url starts with digital_object_data_source_url."
        );
      } else if (
        !params.digital_object_data_source_base_url &&
        selectedData.digital_object_data_source_base_url != "null" &&
        !params.digital_object_data_source_url.startsWith(
          selectedData.digital_object_data_source_base_url
        )
      ) {
        throw new ErrorHandler(
          412,
          412,
          "Check that digital_object_data_source_base_url starts with digital_object_data_source_url."
        );
      }
    } else {
      if (
        params.digital_object_data_source_base_url &&
        !selectedData.digital_object_data_source_url.startsWith(
          params.digital_object_data_source_base_url
        )
      ) {
        throw new ErrorHandler(
          412,
          412,
          "Check that digital_object_data_source_base_url starts with digital_object_data_source_url."
        );
      } else if (
        !params.digital_object_data_source_base_url &&
        selectedData.digital_object_data_source_base_url != "null" &&
        !selectedData.digital_object_data_source_url.startsWith(
          selectedData.digital_object_data_source_base_url
        )
      ) {
        throw new ErrorHandler(
          412,
          412,
          "Check that digital_object_data_source_base_url starts with digital_object_data_source_url."
        );
      }
    }
    return;
  }

  async getConnectorData(digital_twin_id, digital_object_id) {
    const sql = `SELECT * FROM connectors WHERE digital_object_id = '${digital_object_id}' AND digital_twin_id = '${digital_twin_id}'`;
    return await model.postgres.selectData({ sql });
  }

  async updateOrDeleteConnector(
    connectorData,
    digital_object_id,
    digital_twin_id,
    selectedData,
    params
  ) {
    const [connectorCount, Connector_config] = await Promise.all([
      this.getConnectorCount(connectorData.connector_id),
      model.kafka.GetConnectorConfig({
        connector_id: `${connectorData.connector_id}`,
      }),
    ]);

    if (connectorCount > 1) {
      await this.updateConnector({
        connectorData,
        Connector_config,
        digital_object_id,
        digital_twin_id,
      });
    } else {
      await this.deleteConnector({ connectorData });
    }

    await this.createOrUpdateConnector(
      params.digital_object_data_source_base_url,
      params.digital_object_data_source_url,
      params.digital_object_data_interval,
      selectedData,
      digital_twin_id,
      digital_object_id
    );
    return;
  }

  async getConnectorCount(connector_id) {
    const sql = `SELECT COUNT(*) FROM connectors WHERE connector_id = '${connector_id}'`;
    const result = await model.postgres.selectData({ sql });
    return result.count;
  }

  async createOrUpdateConnector(
    base_url,
    source_url,
    interval,
    selectedData,
    twin_id,
    object_id
  ) {
    if (base_url && base_url.endsWith("/")) {
      base_url = base_url.replace(/\/$/, "");
    }
    if (interval && source_url && base_url) {
      const changeUrl = source_url.replace(base_url, "");

      const existingConnector = await model.postgres.selectData({
        sql: `SELECT distinct(connector_id) FROM connectors WHERE base_url = '${base_url}' and poll_interval = '${interval}' and change_url is not null;`,
      });

      if (existingConnector.connector_id) {
        await this.updateExistingConnector(
          base_url,
          existingConnector,
          twin_id,
          object_id,
          changeUrl,
          interval
        );
      } else {
        await this.createNewConnector(
          base_url,
          twin_id,
          object_id,
          changeUrl,
          interval
        );
      }
    } else if (interval && source_url) {
      if (selectedData.digital_object_data_source_base_url != "null") {
        base_url = selectedData.digital_object_data_source_base_url;

        const existingConnector = await model.postgres.selectData({
          sql: `SELECT distinct(connector_id) FROM connectors WHERE base_url = '${base_url}' and poll_interval = '${interval}' and change_url is not null;`,
        });

        const changeUrl = source_url.replace(base_url, "");
        if (existingConnector.connector_id) {
          await this.updateExistingConnector(
            base_url,
            existingConnector,
            twin_id,
            object_id,
            changeUrl,
            interval
          );
        } else {
          await this.createNewConnector(
            base_url,
            twin_id,
            object_id,
            changeUrl,
            interval
          );
        }
      } else {
        //base_url이 없으면 커넥터 단독으로 실행. base_url 있는 것과 순서가 혼돈 가능성 있음
        await this.createNewConnector(
          source_url,
          twin_id,
          object_id,
          "",
          interval
        );
      }
    } else if (source_url && base_url) {
      const existingConnector = await model.postgres.selectData({
        sql: `SELECT distinct(connector_id) FROM connectors WHERE base_url = '${base_url}' and poll_interval = '${selectedData.digital_object_data_interval}' and change_url is not null;`,
      });

      const changeUrl = source_url.replace(base_url, "");
      if (existingConnector.connector_id) {
        await this.updateExistingConnector(
          base_url,
          existingConnector,
          twin_id,
          object_id,
          changeUrl,
          selectedData.digital_object_data_interval
        );
      } else {
        await this.createNewConnector(
          base_url,
          twin_id,
          object_id,
          changeUrl,
          selectedData.digital_object_data_interval
        );
      }
    } else if (interval && base_url) {
      const existingConnector = await model.postgres.selectData({
        sql: `SELECT distinct(connector_id) FROM connectors WHERE base_url = '${base_url}' and poll_interval = '${interval}' and change_url is not null;`,
      });

      const changeUrl = selectedData.digital_object_data_source_url.replace(
        base_url,
        ""
      );

      if (existingConnector.connector_id) {
        await this.updateExistingConnector(
          base_url,
          existingConnector,
          twin_id,
          object_id,
          changeUrl,
          interval
        );
      } else {
        await this.createNewConnector(
          base_url,
          twin_id,
          object_id,
          changeUrl,
          interval
        );
      }
    } else if (base_url) {
      const existingConnector = await model.postgres.selectData({
        sql: `SELECT distinct(connector_id) FROM connectors WHERE base_url = '${base_url}' and poll_interval = '${selectedData.digital_object_data_interval}' and change_url is not null;`,
      });

      const changeUrl = selectedData.digital_object_data_source_url.replace(
        base_url,
        ""
      );
      if (existingConnector.connector_id) {
        await this.updateExistingConnector(
          base_url,
          existingConnector,
          twin_id,
          object_id,
          changeUrl,
          selectedData.digital_object_data_interval
        );
      } else {
        await this.createNewConnector(
          base_url,
          twin_id,
          object_id,
          changeUrl,
          selectedData.digital_object_data_interval
        );
      }
    } else if (source_url) {
      if (selectedData.digital_object_data_source_base_url != "null") {
        base_url = selectedData.digital_object_data_source_base_url;
        const existingConnector = await model.postgres.selectData({
          sql: `SELECT distinct(connector_id) FROM connectors WHERE base_url = '${base_url}' and poll_interval = '${selectedData.digital_object_data_interval}' and change_url is not null;`,
        });

        const changeUrl = source_url.replace(base_url, "");
        if (existingConnector.connector_id) {
          await this.updateExistingConnector(
            base_url,
            existingConnector,
            twin_id,
            object_id,
            changeUrl,
            selectedData.digital_object_data_interval
          );
        } else {
          await this.createNewConnector(
            base_url,
            twin_id,
            object_id,
            changeUrl,
            selectedData.digital_object_data_interval
          );
        }
      } else {
        await this.createNewConnector(
          source_url,
          twin_id,
          object_id,
          "",
          selectedData.digital_object_data_interval
        );
      }
    } else if (interval) {
      source_url = selectedData.digital_object_data_source_url;

      if (selectedData.digital_object_data_source_base_url != "null") {
        base_url = selectedData.digital_object_data_source_base_url;
        const changeUrl = source_url.replace(base_url, "");

        const existingConnector = await model.postgres.selectData({
          sql: `SELECT distinct(connector_id) FROM connectors WHERE base_url = '${base_url}' and poll_interval = '${interval}' and change_url is not null;`,
        });

        if (existingConnector.connector_id) {
          await this.updateExistingConnector(
            base_url,
            existingConnector,
            twin_id,
            object_id,
            changeUrl,
            interval
          );
        } else {
          await this.createNewConnector(
            base_url,
            twin_id,
            object_id,
            changeUrl,
            interval
          );
        }
      } else {
        await this.createNewConnector(
          source_url,
          twin_id,
          object_id,
          "",
          interval
        );
      }
    }
    return;
  }

  async updateDigitalObject(twin_id, object_id, params) {
    let sql = `UPDATE digital_objects SET `;
    const updates = [];
    for (let key in params) {
      if (key === "keywords" || key === "subjects") {
        updates.push(`${key} = '{${params[key]}}'`);
      } else if (
        [
          "digital_object_data_model",
          "digital_object_control_request_model",
          "do_metadata",
          "preliminary_field",
        ].includes(key)
      ) {
        updates.push(`${key} = '${JSON.stringify(params[key])}'`);
      } else if (key === "digital_object_data_interval") {
        updates.push(`${key} = ${params[key]}`);
      } else if (key === "digital_object_data_source_base_url") {
        if (params[key].endsWith("/")) {
          params[key] = params[key].replace(/\/$/, "");
        }
        updates.push(`${key} = '${params[key]}'`);
      } else {
        updates.push(`${key} = '${params[key]}'`);
      }
    }
    sql += updates.join(", ");
    sql += ` WHERE digital_object_id = '${object_id}' AND digital_twin_id = '${twin_id}'`;
    await model.postgres.sendQuery({ sql });
    return;
  }

  async updateConnector({
    connectorData,
    Connector_config,
    digital_object_id,
    digital_twin_id,
  }) {
    const [digitalTwinIds, digitalObjectIds, apiChangeUrls] = [
      "digital.twin.id",
      "digital.object.id",
      "api.change.url",
    ].map((key) => Connector_config[key].split(","));

    const indexToRemove = digitalObjectIds.indexOf(digital_object_id);

    if (indexToRemove !== -1) {
      digitalTwinIds.splice(indexToRemove, 1);
      digitalObjectIds.splice(indexToRemove, 1);
      apiChangeUrls.splice(indexToRemove, 1);
    }

    await model.kafka.updateSourceHttpConnectorGroup({
      name: connectorData.connector_id,
      base_url: connectorData.base_url,
      change_urls: apiChangeUrls.join(","),
      digital_object_ids: digitalObjectIds.join(","),
      digital_twin_ids: digitalTwinIds.join(","),
      digital_object_data_interval: connectorData.poll_interval,
    });

    const sql = `DELETE FROM connectors WHERE connector_id = '${connectorData.connector_id}' AND digital_object_id = '${digital_object_id}' AND digital_twin_id = '${digital_twin_id}'`;
    await model.postgres.sendQuery({ sql });
    return;
  }

  async deleteConnector({ connectorData }) {
    await model.kafka.deleteSink({ id: `${connectorData.connector_id}` });
    const sql = `DELETE FROM connectors WHERE connector_id = '${connectorData.connector_id}'`;
    await model.postgres.sendQuery({ sql });
    return;
  }

  /**
   * [DELETE] digital_object
   * @returns
   */
  async delete({ digital_twin_id, digital_object_id }) {
    // 1. digital_object_id 존재 여부 확인
    const isExistID = await model.postgres.checkIdExist({
      table: "digital_objects",
      check: "digital_object_id",
      id: digital_object_id,
      digital_twin_id,
    });
    if (!isExistID) {
      throw new ErrorHandler(412, 412, "Unregistered digital_object");
    }

    // 2. fdo_compositions에 연합 여부 확인
    const fdoCheckSQL = `SELECT federated_digital_object_id FROM fdo_compositions WHERE digital_object_id = '${digital_object_id}';`;
    const fdoResult = await model.postgres.selectDataS({ sql: fdoCheckSQL });
    console.log("fdoResult: ", fdoResult);
    if (fdoResult && fdoResult.length > 0) {
      throw new ErrorHandler(
        409,
        409,
        `Cannot delete: digital_object is federated in fdo_compositions. federated_digital_object_id(s): ${JSON.stringify(
          fdoResult
        )}`
      );
    }

    const selectSQL = `SELECT * FROM digital_objects WHERE digital_object_id = '${digital_object_id}' AND digital_twin_id = '${digital_twin_id}'`;
    const selectedData = await model.postgres.selectData({ sql: selectSQL });

    const deleteSQL = `DELETE FROM digital_objects WHERE digital_object_id = '${digital_object_id}'`;
    await model.postgres.sendQuery({ sql: deleteSQL });

    if (selectedData.digital_object_data_source_type === "POLL") {
      const connectorData = await this.getConnectorData(
        digital_twin_id,
        digital_object_id
      );
      const [connectorCount, Connector_config] = await Promise.all([
        this.getConnectorCount(connectorData.connector_id),
        model.kafka.GetConnectorConfig({
          connector_id: `${connectorData.connector_id}`,
        }),
      ]);

      if (connectorCount > 1) {
        await this.updateConnector({
          connectorData,
          Connector_config,
          digital_object_id,
          digital_twin_id,
        });
      } else {
        await this.deleteConnector({ connectorData });
      }
    }

    return { delete: digital_object_id };
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
      throw new ErrorHandler(412, 412, "Unregistered digital_object");
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
      throw new ErrorHandler(412, 412, "Unregistered digital_object");
    }
  }

  /**
   * DO data 생성
   * @returns {}
   */
  async createDigitalObjectData({ digital_twin_id, digital_object_id }, body) {
    const isExistID = await model.postgres.checkIdExist({
      table: "digital_objects",
      check: "digital_object_id",
      id: digital_object_id,
      digital_twin_id,
    });
    if (!isExistID) {
      throw new ErrorHandler(412, 412, "Unregistered digital_object");
    }
    // "observedAt" check
    const findObservedAt = (data) => {
      if (typeof data !== "object" || data === null) return null;
      if (data.hasOwnProperty("observedAt")) return data.observedAt;

      for (const key in data) {
        const result = findObservedAt(data[key]);
        if (result) return result;
      }

      return null;
    };

    let rowtime = (await findObservedAt(body.data)) || lib.timestamp();
    let geojsonToWkt = this.getGeojsonToWkt(body.location);
    if (Array.isArray(body.data)) {
      await this.processMultipleData(
        digital_twin_id,
        digital_object_id,
        body.data,
        rowtime,
        geojsonToWkt
      );
    } else {
      await this.processSingleData(
        digital_twin_id,
        digital_object_id,
        body.data,
        rowtime,
        geojsonToWkt
      );
    }

    return 0;
  }

  getGeojsonToWkt(location) {
    try {
      return location ? stringify(location) : "POINT EMPTY";
    } catch (error) {
      throw new ErrorHandler(
        412,
        412,
        "location requires a valid GeoJSON Feature or geometry object as input"
      );
    }
  }

  async processMultipleData(
    digital_twin_id,
    digital_object_id,
    dataArray,
    rowtime,
    geojsonToWkt
  ) {
    const tasks = dataArray.map((item) =>
      this.processSingleData(
        digital_twin_id,
        digital_object_id,
        item,
        rowtime,
        geojsonToWkt
      )
    );
    await Promise.all(tasks);
  }

  async processSingleData(
    digital_twin_id,
    digital_object_id,
    dataItem,
    rowtime,
    geojsonToWkt
  ) {
    const valueObjectMessage = {
      digital_twin_id,
      digital_object_id,
      data: JSON.stringify(dataItem),
      rowtime,
      location: geojsonToWkt,
    };

    // console.log(valueObjectMessage);
    const kafkaKey = { digital_object_id };
    await model.kafka.kafkaProducer({
      topic: "UnalliedDigitalObjects",
      kafkaKey: JSON.stringify(kafkaKey),
      data: JSON.stringify(valueObjectMessage),
    });
  }

  /**
   * digital_object data 조회
   * @param {string} digital_twin_id
   * @param {string} id digital_object_id
   * @param {string} from startDateTime
   * @param {string} to endDateTime
   * @returns {Json} 기간별 조회
   */
  async getData({ digital_twin_id, id, from, to, count, offset = 0 }) {
    const isExistID = await model.postgres.checkIdExist({
      table: "digital_objects",
      check: "digital_object_id",
      id,
      digital_twin_id,
    });
    if (!isExistID) {
      throw new ErrorHandler(412, 412, "Unregistered digital_object");
    }

    let sql = `SELECT * FROM digital_object_data WHERE digital_twin_id = '${digital_twin_id}' AND digital_object_id = '${id}'`;

    if (from && to) {
      sql += ` AND rowtime >= '${from}'::timestamp AND rowtime <= '${to}'::timestamp`;
    }

    if (count) {
      sql += ` ORDER BY rowtime ${
        from && to ? "ASC" : "DESC"
      } LIMIT ${count} OFFSET ${offset}`;
    } else if (!from && !to) {
      sql += ` ORDER BY rowtime DESC LIMIT 100`;
    }

    const retrievedData = await model.postgres.selectDataS({ sql });
    return retrievedData;
  }

  /**
   * 저장된 모든 DO의 이름 조회
   * @returns {List}
   */
  async getAll({ digital_twin_id }) {
    const isExistDtId = await model.postgres.checkIdExist({
      table: "digital_twins",
      check: "digital_twin_id",
      id: digital_twin_id,
    });
    if (!isExistDtId) {
      throw new ErrorHandler(412, 412, "Unregistered digital_twin");
    }
    const sql = `select * from digital_objects where digital_twin_id = '${digital_twin_id}';`;
    const DOentireList = await model.postgres.selectDataS({ sql });

    return DOentireList;
  }

  /**
   * 저장된 모든 DO 삭제
   * @returns {}
   */
  async deleteAll({ digital_twin_id }) {
    const isExistDtId = await model.postgres.checkIdExist({
      table: "digital_twins",
      check: "digital_twin_id",
      id: digital_twin_id,
    });
    if (!isExistDtId) {
      throw new ErrorHandler(412, 412, "Unregistered digital_twin");
    }
    const sql = `delete from digital_objects where 'digital_twin_id' = '${digital_twin_id}'; delete from digital_object_data where 'digital_twin_id' = '${digital_twin_id}'; delete from name_list where type='digital_object' and digital_twin_id = '${digital_twin_id}'`;
    const DOentireDelete = await model.postgres.sendQuery({ sql });

    return DOentireDelete;
  }

  /**
   * Digital Object의 Controller 제어
   * @param {String} digital_twin_id (required)
   * @param {String} digital_object_id (required)
   * @param {Json} control_command (required)
   *
   * @returns {Json} {}
   */
  async createDOControlData(digital_twin_id, digital_object_id, params) {
    const control_creation_time = lib.timestamp();
    const control_message = params;
    if (!digital_twin_id || !digital_object_id) {
      throw new ErrorHandler(412, 5252, "please check mandatory field.");
    }

    // DO 존재하는지 확인
    const isExistID = await model.postgres.checkIdExist({
      table: "digital_objects",
      check: "digital_object_id",
      id: digital_object_id,
      digital_twin_id: digital_twin_id,
    });
    if (!isExistID) {
      throw new ErrorHandler(412, 5252, "Unregistered digital_object");
    }

    /**
     * DO Control Access URL 조회
     */
    let { digital_object_control_url } = await this.Retrieve({
      digital_twin_id,
      digital_object_id,
    });

    /**
     * control message 처리
     */
    let httpResponse = await lib.request({
      url: digital_object_control_url,
      bodyParams: control_message,
    });

    if (Object.prototype.toString.call(httpResponse) === "[object Object]") {
      httpResponse = JSON.stringify(httpResponse);
    }

    const control_delivery_time = lib.timestamp();
    if (httpResponse) {
      let sql = `insert into digital_object_controllers (digital_twin_id, digital_object_id, control_creation_time, control_delivery_time, control_delivery_result, control_command) values ('${digital_twin_id}', '${digital_object_id}', '${control_creation_time}', '${control_delivery_time}', '${httpResponse}', '${JSON.stringify(
        control_message
      )}');`;
      await model.postgres.sendQuery({ sql });
      return httpResponse;
    } else if (httpResponse == undefined) {
      let control_delivery_result = "No controller response";
      let sql = `insert into digital_object_controllers (digital_twin_id, digital_object_id, control_creation_time, control_delivery_time, control_delivery_result, control_command) values ('${digital_twin_id}', '${digital_object_id}', '${control_creation_time}', '${control_delivery_time}', '${control_delivery_result}', '${JSON.stringify(
        control_message
      )}');`;
      await model.postgres.sendQuery({ sql });
      return control_delivery_result;
    } else {
      throw new ErrorHandler(412, 5252, "Something Control Error");
    }
  }

  /**
   * digital_object contorl data 조회 - 최신 데이터
   * @param {string} digital_twin_id
   * @param {string} digital_object_id
   * @param {string} from startDateTime
   * @param {string} to endDateTime\
   * @param {number} count
   * @returns {Json} 기간별 조회
   */
  async searchControl({ digital_twin_id, digital_object_id, from, to, count }) {
    if (!digital_twin_id || !digital_object_id) {
      throw new ErrorHandler(412, 5252, "please check mandatory field.");
    }
    const isExistID = await model.postgres.checkIdExist({
      table: "digital_objects",
      check: "digital_object_id",
      id: digital_object_id,
    });

    if (!isExistID) {
      throw new ErrorHandler(412, 5252, "Unregistered digital_object");
    }

    if (from && to) {
      let sql = `SELECT * FROM digital_object_controllers WHERE digital_twin_id='${digital_twin_id}' AND digital_object_id='${digital_object_id}' AND control_delivery_time >= '${from}'::timestamp AND control_delivery_time <= '${to}'::timestamp`;
      if (count) {
        sql += ` limit ${count};`;
      }
      const retrievedData = await model.postgres.selectDataS({ sql });
      return retrievedData;
    } else if (from) {
      let sql = `SELECT * FROM digital_object_controllers WHERE digital_twin_id='${digital_twin_id}' AND digital_object_id='${digital_object_id}' AND control_delivery_time >= '${from}'::timestamp`;
      if (count) {
        sql += ` limit ${count};`;
      }
      const retrievedData = await model.postgres.selectDataS({ sql });
      return retrievedData;
    } else if (to) {
      let sql = `SELECT * FROM digital_object_controllers WHERE digital_twin_id='${digital_twin_id}' AND digital_object_id='${digital_object_id}' AND control_delivery_time <= '${to}'::timestamp`;
      if (count) {
        sql += ` limit ${count};`;
      }
      const retrievedData = await model.postgres.selectDataS({ sql });
      return retrievedData;
    } else {
      let sql = `select * from digital_object_controllers`;
      if (count) {
        sql += ` limit ${count};`;
      }
      const retrievedData = await model.postgres.selectDataS({ sql });
      return retrievedData;
    }
  }

  /**
   * digital_object_id로 상위 digital_twin 정보 조회
   * @param {string} digital_object_id
   * @returns {Json}
   */
  async SearchTwinByObjectId({ digital_object_id }) {
    console.log("SearchTwinByObjectId: ", digital_object_id);
    const isExistDOid = await model.postgres.checkIdExist({
      table: "digital_objects",
      check: "digital_object_id",
      id: digital_object_id,
    });
    if (isExistDOid) {
      const sql = `
        SELECT dobj.digital_object_id, dobj.digital_object_name,
               dt.digital_twin_id, dt.digital_twin_name
        FROM digital_objects AS dobj
        JOIN digital_twins AS dt
          ON dobj.digital_twin_id = dt.digital_twin_id
        WHERE dobj.digital_object_id = '${digital_object_id}'
      `;
      const result = await model.postgres.selectDataS({ sql });
      return result;
    } else {
      throw new ErrorHandler(412, 412, "Unregistered digital_object_id");
    }
  }
}

module.exports = DigitalObjects;
