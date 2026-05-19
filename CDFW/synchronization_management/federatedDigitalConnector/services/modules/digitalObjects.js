const ErrorHandler = require("../../lib/error-handler");
const lib = require("../../lib/index");
const config = require("../../config");
const Model = require("../../models");
const model = new Model();
const { stringify } = require("wkt");
const axios = require("axios");

const KAFKA_CONNECT_RETRY_MAX = 5;
const KAFKA_CONNECT_RETRY_DELAY_MS = 1500;

/**
 * Kafka Connect REST 호출 (409 리밸런스 시 backoff retry, 404는 옵션으로 무시)
 */
async function kafkaConnectCall({ method, url, data, allow404 = false }) {
  let lastErr;
  for (let attempt = 1; attempt <= KAFKA_CONNECT_RETRY_MAX; attempt++) {
    try {
      const res = await axios({
        method,
        url,
        data,
        headers: { "Content-Type": "application/json" },
      });
      return res.data;
    } catch (e) {
      const status = e.response?.status;
      if (status === 404 && allow404) return null;
      if (status === 409 && attempt < KAFKA_CONNECT_RETRY_MAX) {
        await new Promise((r) =>
          setTimeout(r, KAFKA_CONNECT_RETRY_DELAY_MS * attempt)
        );
        lastErr = e;
        continue;
      }
      throw e;
    }
  }
  throw lastErr;
}

/**
 * connectors 테이블의 row 배열에서 HttpSourceGroupConnector config body 생성
 */
function buildHttpGroupConfig(rows) {
  return {
    "connector.class": "org.kafka.connect.http.HttpSourceGroupConnector",
    "kafka.topic": "UnalliedDigitalObjects",
    "api.base.url": rows[0].base_url,
    "api.change.url": rows.map((r) => r.change_url).join(","),
    "digital.twin.id": rows.map((r) => r.digital_twin_id).join(","),
    "digital.object.id": rows.map((r) => r.digital_object_id).join(","),
    headers:
      "Content-Type:application/json|Accept-Encoding: application/json",
    "key.converter": "org.apache.kafka.connect.storage.StringConverter",
    "value.converter": "org.apache.kafka.connect.storage.StringConverter",
    "data.source.format": "json",
    "poll.interval.ms": rows[0].poll_interval,
  };
}

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
        "digital_object_identifier already in use",
      );
    }

    /* ================================
     * control URL reachable check
     * ================================ */
    if (params.digital_object_control_url) {
      try {
        const resp = await axios.get(params.digital_object_control_url, {
          timeout: 5000,
        }); // 5초 제한
        if (resp.status < 200 || resp.status >= 400) {
          throw new Error();
        } else {
          console.log(
            `digital_object_control_url "${params.digital_object_control_url}" is reachable.response.status: ${resp.status}`,
          );
        }
      } catch (e) {
        throw new ErrorHandler(
          412,
          412,
          `digital_object_control_url "${params.digital_object_control_url}" is not reachable or invalid (HTTP connection failed)`,
        );
      }
    }

    const formattedCreationTime = await this.formatTime(params.creation_time);
    const formattedModificationTime = await this.formatTime(
      params.modification_time,
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
      formattedModificationTime,
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
    modification_time,
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
         digital_object_control_delivery_timeout,
         digital_object_control_execution_timeout,
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
            ${params.digital_object_control_delivery_timeout},
            ${params.digital_object_control_execution_timeout},
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
          "When the digital_object_data_source_type is set to POLL the digital_object_data_source_url is required",
        );
      }

      if (!source_url.startsWith("http")) {
        throw new ErrorHandler(
          412,
          412,
          "Check that the digital_object_data_source_url starts with 'http://'.",
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
          `digital_object_data_source_url "${source_url}" is already registered by digital_object_id: ${doWithSameUrl.digital_object_id}`,
        );
      }
      // 실제 연결 가능한 URL인지 체크
      try {
        const resp = await axios.get(source_url, { timeout: 5000 }); // 5초 제한
        if (resp.status < 200 || resp.status >= 400) {
          throw new Error();
        } else {
          console.log(
            `digital_object_data_source_url "${source_url}" is reachable.response.status: ${resp.status}`,
          );
        }
      } catch (e) {
        throw new ErrorHandler(
          412,
          412,
          `digital_object_data_source_url "${source_url}" is not reachable or invalid (HTTP connection failed)`,
        );
      }

      if (base_url) {
        if (!source_url.startsWith(base_url)) {
          throw new ErrorHandler(
            412,
            412,
            "Check that digital_object_data_source_base_url starts with digital_object_data_source_url.",
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
            poll_interval,
          );
        } else {
          await this.createNewConnector(
            base_url,
            digital_twin_id,
            digital_object_id,
            changeUrl,
            poll_interval,
          );
        }
      } else {
        await this.createNewConnector(
          source_url,
          digital_twin_id,
          digital_object_id,
          "",
          poll_interval,
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
    interval,
  ) {
    const connector_id = existingConnector.connector_id;
    const kafkaBase = `http://${config.kafka.connectHost}/connectors`;

    // 1) DB의 현재 멤버 조회 (Kafka GET 사용 안 함 → 409 race 회피)
    const existingRows = await model.postgres.selectDataS({
      sql: `SELECT * FROM connectors WHERE connector_id = '${connector_id}'`,
    });

    // 2) 중복 방지: 같은 (twin_id, do_id, change_url) 이미 있으면 스킵
    const isDuplicate = existingRows.some(
      (r) =>
        r.digital_twin_id === digital_twin_id &&
        r.digital_object_id === digital_object_id &&
        r.change_url === changeUrl
    );
    if (isDuplicate) {
      logger.warn(
        `[digitalObjects.updateExistingConnector] duplicate entry skip: ${connector_id} / ${digital_twin_id} / ${digital_object_id}`
      );
      return;
    }

    // 3) 새 엔트리 합쳐서 PUT (retry 포함)
    const newRows = [
      ...existingRows,
      {
        base_url,
        poll_interval: interval,
        digital_twin_id,
        digital_object_id,
        change_url: changeUrl,
      },
    ];
    await kafkaConnectCall({
      method: "put",
      url: `${kafkaBase}/${connector_id}/config`,
      data: buildHttpGroupConfig(newRows),
    });

    // 4) PUT 성공 후 connectors 테이블에 INSERT
    const insertConnectorSQL = `INSERT INTO connectors (connector_id, base_url, poll_interval, digital_object_id, digital_twin_id, change_url) VALUES (
          '${connector_id}', '${base_url}', ${interval},
          '${digital_object_id}', '${digital_twin_id}', '${changeUrl}'
       )`;
    await model.postgres.sendQuery({ sql: insertConnectorSQL });
    return;
  }

  async createNewConnector(
    base_url,
    digital_twin_id,
    digital_object_id,
    changeUrl,
    interval,
  ) {
    const newConnectorId = `HttpSource${uuid()}`;
    const kafkaBase = `http://${config.kafka.connectHost}/connectors`;

    // 1) Kafka에 먼저 POST (retry 포함). 실패 시 throw → DB INSERT 안 됨 → drift 방지.
    await kafkaConnectCall({
      method: "post",
      url: kafkaBase,
      data: {
        name: newConnectorId,
        config: buildHttpGroupConfig([
          {
            base_url,
            poll_interval: interval,
            digital_twin_id,
            digital_object_id,
            change_url: changeUrl,
          },
        ]),
      },
    });

    // 2) POST 성공 후 connectors 테이블에 INSERT
    const insertConnectorSQL = `INSERT INTO connectors (connector_id, base_url, poll_interval, digital_object_id, digital_twin_id, change_url) VALUES (
         '${newConnectorId}', '${base_url}', ${interval},
         '${digital_object_id}', '${digital_twin_id}', '${changeUrl}'
      )`;
    await model.postgres.sendQuery({ sql: insertConnectorSQL });
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
        `Unregistered digital_object ${digital_object_id}`,
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
            `[update] No change detected in base_url/source_url/interval, skipping connector update.`,
          );
          await this.updateDigitalObject(
            digital_twin_id,
            digital_object_id,
            params,
          );
          return { update: digital_object_id };
        }

        // URL 접근 가능성 검증
        if (isSourceUrlChanged && params.digital_object_data_source_url) {
          try {
            const response = await axios.get(
              params.digital_object_data_source_url,
              { timeout: 5000 },
            );
            if (response.status < 200 || response.status >= 400) {
              throw new Error();
            }
            console.log(
              `[update] Verified reachable URL: ${params.digital_object_data_source_url}`,
            );
          } catch (err) {
            throw new ErrorHandler(
              412,
              412,
              `digital_object_data_source_url "${params.digital_object_data_source_url}" is not reachable or invalid (HTTP connection failed)`,
            );
          }
        }

        if (dataAccessType != "http") {
          await this.updateDigitalObject(
            digital_twin_id,
            digital_object_id,
            params,
          );

          return { update: digital_object_id };
        }

        await this.validateParams(params, selectedData);

        if (dataSourceType === "POLL") {
          const connectorData = await this.getConnectorData(
            digital_twin_id,
            digital_object_id,
          );
          if (connectorData.connector_id) {
            // 이미 커넥터 존재 시 업데이트 or 삭제
            await this.updateOrDeleteConnector(
              connectorData,
              digital_object_id,
              digital_twin_id,
              selectedData,
              params,
            );
          } else {
            // 새 커넥터 생성
            await this.createOrUpdateConnector(
              params.digital_object_data_source_base_url,
              params.digital_object_data_source_url,
              params.digital_object_data_interval,
              selectedData,
              digital_twin_id,
              digital_object_id,
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
              "Check the digital_object_data_source_type.",
            );
          }
          await this.createOrUpdateConnector(
            params.digital_object_data_source_base_url,
            params.digital_object_data_source_url,
            params.digital_object_data_interval,
            selectedData,
            digital_twin_id,
            digital_object_id,
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
        "Check that the digital_object_data_source_url starts with 'http://'.",
      );
    }
    if (params.digital_object_data_source_url) {
      if (
        params.digital_object_data_source_base_url &&
        !params.digital_object_data_source_url.startsWith(
          params.digital_object_data_source_base_url,
        )
      ) {
        throw new ErrorHandler(
          412,
          412,
          "Check that digital_object_data_source_base_url starts with digital_object_data_source_url.",
        );
      } else if (
        !params.digital_object_data_source_base_url &&
        selectedData.digital_object_data_source_base_url != "null" &&
        !params.digital_object_data_source_url.startsWith(
          selectedData.digital_object_data_source_base_url,
        )
      ) {
        throw new ErrorHandler(
          412,
          412,
          "Check that digital_object_data_source_base_url starts with digital_object_data_source_url.",
        );
      }
    } else {
      if (
        params.digital_object_data_source_base_url &&
        !selectedData.digital_object_data_source_url.startsWith(
          params.digital_object_data_source_base_url,
        )
      ) {
        throw new ErrorHandler(
          412,
          412,
          "Check that digital_object_data_source_base_url starts with digital_object_data_source_url.",
        );
      } else if (
        !params.digital_object_data_source_base_url &&
        selectedData.digital_object_data_source_base_url != "null" &&
        !selectedData.digital_object_data_source_url.startsWith(
          selectedData.digital_object_data_source_base_url,
        )
      ) {
        throw new ErrorHandler(
          412,
          412,
          "Check that digital_object_data_source_base_url starts with digital_object_data_source_url.",
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
    params,
  ) {
    // DB 기반 정리: 기존 (twin_id, object_id) 엔트리를 Kafka에서 제거
    // GET 호출 없이 connectors 테이블로 잔여 멤버를 계산 → 1회 PUT/DELETE
    await this.cleanupConnectorEntry({
      connector_id: connectorData.connector_id,
      digital_twin_id,
      digital_object_id,
    });

    // 새 파라미터로 (재)등록
    await this.createOrUpdateConnector(
      params.digital_object_data_source_base_url,
      params.digital_object_data_source_url,
      params.digital_object_data_interval,
      selectedData,
      digital_twin_id,
      digital_object_id,
    );
    return;
  }

  /**
   * 특정 (connector_id, twin_id, object_id) 엔트리를 Kafka와 connectors 테이블에서 제거.
   * - 잔여 멤버 0개: Kafka 커넥터 전체 DELETE
   * - 잔여 멤버 있음: 잔여 멤버로 config PUT
   * - 어느 쪽이든 connectors 테이블의 해당 row 삭제
   * - Kafka 측 실패는 logger.error만 남기고 DB 정리는 진행
   */
  async cleanupConnectorEntry({
    connector_id,
    digital_twin_id,
    digital_object_id,
  }) {
    if (!connector_id) return;

    const kafkaBase = `http://${config.kafka.connectHost}/connectors`;
    const allRows = await model.postgres.selectDataS({
      sql: `SELECT * FROM connectors WHERE connector_id = '${connector_id}'`,
    });
    const remaining = allRows.filter(
      (r) =>
        !(
          r.digital_object_id === digital_object_id &&
          r.digital_twin_id === digital_twin_id
        )
    );

    try {
      if (remaining.length === 0) {
        await kafkaConnectCall({
          method: "delete",
          url: `${kafkaBase}/${connector_id}`,
          allow404: true,
        });
      } else {
        await kafkaConnectCall({
          method: "put",
          url: `${kafkaBase}/${connector_id}/config`,
          data: buildHttpGroupConfig(remaining),
        });
      }
    } catch (e) {
      logger.error(
        `[digitalObjects.cleanupConnectorEntry] Kafka cleanup failed for ${connector_id}: ${e.message}`
      );
    }

    await model.postgres.sendQuery({
      sql: `DELETE FROM connectors WHERE connector_id = '${connector_id}' AND digital_object_id = '${digital_object_id}' AND digital_twin_id = '${digital_twin_id}'`,
    });
  }

  /**
   * (twin_id, object_id) 조합을 들고 있는 잔존 Kafka 그룹 커넥터를 정리.
   * DB에 없지만 Kafka 쪽에만 남은 drift 보정용.
   * skipConnectorId로 이미 처리한 connector_id를 제외.
   */
  async sweepOrphanKafkaEntries({
    digital_twin_id,
    digital_object_id,
    skipConnectorId,
  }) {
    const kafkaBase = `http://${config.kafka.connectHost}/connectors`;
    let allConnectors;
    try {
      allConnectors = await kafkaConnectCall({
        method: "get",
        url: kafkaBase,
      });
    } catch (e) {
      logger.error(
        `[digitalObjects.sweepOrphanKafkaEntries] list connectors failed: ${e.message}`
      );
      return;
    }

    const httpGroupNames = (allConnectors ?? []).filter(
      (name) => typeof name === "string" && name.startsWith("HttpSource")
    );

    for (const name of httpGroupNames) {
      if (name === skipConnectorId) continue;

      let cfgRes;
      try {
        cfgRes = await kafkaConnectCall({
          method: "get",
          url: `${kafkaBase}/${name}`,
          allow404: true,
        });
      } catch (e) {
        logger.error(
          `[digitalObjects.sweepOrphanKafkaEntries] get config ${name} failed: ${e.message}`
        );
        continue;
      }
      if (!cfgRes) continue;

      const cfg = cfgRes.config ?? cfgRes;
      const twinIds = String(cfg?.["digital.twin.id"] ?? "").split(",");
      const objIds = String(cfg?.["digital.object.id"] ?? "").split(",");

      const len = Math.min(twinIds.length, objIds.length);
      let hasMatch = false;
      for (let i = 0; i < len; i++) {
        if (
          twinIds[i] === digital_twin_id &&
          objIds[i] === digital_object_id
        ) {
          hasMatch = true;
          break;
        }
      }
      if (!hasMatch) continue;

      // 잔존 발견 → DB 기준으로 강제 reconcile
      const dbRows = await model.postgres.selectDataS({
        sql: `SELECT * FROM connectors WHERE connector_id = '${name}'`,
      });

      try {
        if (dbRows.length === 0) {
          await kafkaConnectCall({
            method: "delete",
            url: `${kafkaBase}/${name}`,
            allow404: true,
          });
        } else {
          await kafkaConnectCall({
            method: "put",
            url: `${kafkaBase}/${name}/config`,
            data: buildHttpGroupConfig(dbRows),
          });
        }
      } catch (e) {
        logger.error(
          `[digitalObjects.sweepOrphanKafkaEntries] reconcile ${name} failed: ${e.message}`
        );
      }
    }
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
    object_id,
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
          interval,
        );
      } else {
        await this.createNewConnector(
          base_url,
          twin_id,
          object_id,
          changeUrl,
          interval,
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
            interval,
          );
        } else {
          await this.createNewConnector(
            base_url,
            twin_id,
            object_id,
            changeUrl,
            interval,
          );
        }
      } else {
        //base_url이 없으면 커넥터 단독으로 실행. base_url 있는 것과 순서가 혼돈 가능성 있음
        await this.createNewConnector(
          source_url,
          twin_id,
          object_id,
          "",
          interval,
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
          selectedData.digital_object_data_interval,
        );
      } else {
        await this.createNewConnector(
          base_url,
          twin_id,
          object_id,
          changeUrl,
          selectedData.digital_object_data_interval,
        );
      }
    } else if (interval && base_url) {
      const existingConnector = await model.postgres.selectData({
        sql: `SELECT distinct(connector_id) FROM connectors WHERE base_url = '${base_url}' and poll_interval = '${interval}' and change_url is not null;`,
      });

      const changeUrl = selectedData.digital_object_data_source_url.replace(
        base_url,
        "",
      );

      if (existingConnector.connector_id) {
        await this.updateExistingConnector(
          base_url,
          existingConnector,
          twin_id,
          object_id,
          changeUrl,
          interval,
        );
      } else {
        await this.createNewConnector(
          base_url,
          twin_id,
          object_id,
          changeUrl,
          interval,
        );
      }
    } else if (base_url) {
      const existingConnector = await model.postgres.selectData({
        sql: `SELECT distinct(connector_id) FROM connectors WHERE base_url = '${base_url}' and poll_interval = '${selectedData.digital_object_data_interval}' and change_url is not null;`,
      });

      const changeUrl = selectedData.digital_object_data_source_url.replace(
        base_url,
        "",
      );
      if (existingConnector.connector_id) {
        await this.updateExistingConnector(
          base_url,
          existingConnector,
          twin_id,
          object_id,
          changeUrl,
          selectedData.digital_object_data_interval,
        );
      } else {
        await this.createNewConnector(
          base_url,
          twin_id,
          object_id,
          changeUrl,
          selectedData.digital_object_data_interval,
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
            selectedData.digital_object_data_interval,
          );
        } else {
          await this.createNewConnector(
            base_url,
            twin_id,
            object_id,
            changeUrl,
            selectedData.digital_object_data_interval,
          );
        }
      } else {
        await this.createNewConnector(
          source_url,
          twin_id,
          object_id,
          "",
          selectedData.digital_object_data_interval,
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
            interval,
          );
        } else {
          await this.createNewConnector(
            base_url,
            twin_id,
            object_id,
            changeUrl,
            interval,
          );
        }
      } else {
        await this.createNewConnector(
          source_url,
          twin_id,
          object_id,
          "",
          interval,
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
    if (fdoResult && fdoResult.length > 0) {
      throw new ErrorHandler(
        409,
        409,
        `Cannot delete: digital_object is federated in fdo_compositions. federated_digital_object_id(s): ${JSON.stringify(
          fdoResult,
        )}`,
      );
    }

    const selectSQL = `SELECT * FROM digital_objects WHERE digital_object_id = '${digital_object_id}' AND digital_twin_id = '${digital_twin_id}'`;
    const selectedData = await model.postgres.selectData({ sql: selectSQL });

    // 3. digital_objects 삭제 - (do_id, twin_id) 복합키로 지정
    const deleteSQL = `DELETE FROM digital_objects WHERE digital_object_id = '${digital_object_id}' AND digital_twin_id = '${digital_twin_id}'`;
    await model.postgres.sendQuery({ sql: deleteSQL });

    // 4. POLL DO면 Kafka 그룹 커넥터에서 해당 엔트리 제거
    let primaryConnectorId = null;
    if (selectedData.digital_object_data_source_type === "POLL") {
      const connectorData = await this.getConnectorData(
        digital_twin_id,
        digital_object_id,
      );
      if (connectorData?.connector_id) {
        primaryConnectorId = connectorData.connector_id;
        // DB 기반 정리 (GET 없음, 409 race 회피)
        await this.cleanupConnectorEntry({
          connector_id: primaryConnectorId,
          digital_twin_id,
          digital_object_id,
        });
      }
    }

    // 5. Drift sweep — DB엔 없지만 Kafka에 (twin_id, object_id) 잔존이 있으면 reconcile
    //    이미 처리한 connector_id는 skipConnectorId로 제외
    await this.sweepOrphanKafkaEntries({
      digital_twin_id,
      digital_object_id,
      skipConnectorId: primaryConnectorId,
    });

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
    const rowtime = this.normalizeRowtime(body.rowtime) || lib.timestamp();
    let geojsonToWkt = this.getGeojsonToWkt(body.location);
    if (Array.isArray(body.data)) {
      await this.processMultipleData(
        digital_twin_id,
        digital_object_id,
        body.data,
        rowtime,
        geojsonToWkt,
      );
    } else {
      await this.processSingleData(
        digital_twin_id,
        digital_object_id,
        body.data,
        rowtime,
        geojsonToWkt,
      );
    }

    return 0;
  }

  normalizeRowtime(t) {
    if (!t || typeof t !== "string") return null;
    const stripped = t
      .trim()
      .replace(/Z$/i, "")
      .replace(/[+-]\d{2}:?\d{2}$/, "")
      .replace("T", " ");
    const m = stripped.match(
      /^(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}:\d{2})(?:\.(\d{1,3}))?$/,
    );
    if (!m) return null;
    const ms = (m[3] || "").padEnd(3, "0").substring(0, 3);
    return `${m[1]} ${m[2]}.${ms}`;
  }

  getGeojsonToWkt(location) {
    try {
      return location ? stringify(location) : "POINT EMPTY";
    } catch (error) {
      throw new ErrorHandler(
        412,
        412,
        "location requires a valid GeoJSON Feature or geometry object as input",
      );
    }
  }

  async processMultipleData(
    digital_twin_id,
    digital_object_id,
    dataArray,
    rowtime,
    geojsonToWkt,
  ) {
    const tasks = dataArray.map((item) =>
      this.processSingleData(
        digital_twin_id,
        digital_object_id,
        item,
        rowtime,
        geojsonToWkt,
      ),
    );
    await Promise.all(tasks);
  }

  async processSingleData(
    digital_twin_id,
    digital_object_id,
    dataItem,
    rowtime,
    geojsonToWkt,
  ) {
    const valueObjectMessage = {
      digital_twin_id,
      digital_object_id,
      data: JSON.stringify(dataItem),
      rowtime,
      location: geojsonToWkt,
    };

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
    const esc = (v) => String(v ?? "").replace(/'/g, "''");
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
    let {
      digital_object_control_url,
      digital_object_control_delivery_timeout,
    } = await this.Retrieve({
      digital_twin_id,
      digital_object_id,
    });

    if (!digital_object_control_url) {
      throw new ErrorHandler(
        412,
        5252,
        "digital_object_control_url is not configured",
      );
    }

    /**
     * delivery timeout 결정
     * - null / undefined → 기본값
     * - 숫자(ms) → 해당 값 사용
     */
    const DEFAULT_DELIVERY_TIMEOUT_MS = 5000;
    const deliveryTimeout =
      typeof digital_object_control_delivery_timeout === "number" &&
      digital_object_control_delivery_timeout > 0
        ? digital_object_control_delivery_timeout
        : DEFAULT_DELIVERY_TIMEOUT_MS;

    /**
     * delivery_status 계산 규칙(확장):
     * - DELIVERED        : 컨트롤러가 응답(ACK)을 줌 (응답 내용이 fail이어도 "전달"은 성공)
     * - NO_ACK           : 응답이 비어있거나(undefined/null/빈문자열) "No controller response"
     * - DELIVERY_FAILED  : timeout/네트워크/서버 오류로 요청 자체 실패
     */
    let httpResponse;
    let delivery_status = "NO_ACK";
    let delivery_error = null;

    /**
     * control message 전달 (timeout 적용)
     */
    try {
      httpResponse = await lib.request({
        url: digital_object_control_url,
        bodyParams: control_message,
        timeout: deliveryTimeout,
      });

      // response normalize
      if (Object.prototype.toString.call(httpResponse) === "[object Object]") {
        httpResponse = JSON.stringify(httpResponse);
      }

      // 응답 존재 여부로 delivery_status 결정
      if (
        httpResponse !== undefined &&
        httpResponse !== null &&
        httpResponse !== ""
      ) {
        delivery_status = "DELIVERED";
      } else {
        delivery_status = "NO_ACK";
        httpResponse = "No controller response";
      }
    } catch (err) {
      delivery_status = "DELIVERY_FAILED";
      delivery_error =
        err?.code === "ECONNABORTED"
          ? `Delivery timeout (${deliveryTimeout} ms)`
          : `Delivery error: ${err?.message || String(err)}`;

      // 실패도 delivery_result로 저장
      httpResponse = delivery_error;
    }

    const control_delivery_time = lib.timestamp();
    const control_delivery_result =
      httpResponse !== undefined ? httpResponse : "No controller response";

    const sql = `
    INSERT INTO digital_object_controllers
      (digital_twin_id, digital_object_id, control_creation_time, control_delivery_time, control_delivery_result, control_command, delivery_status, delivery_error)
    VALUES
      ('${esc(digital_twin_id)}', '${esc(digital_object_id)}', '${esc(control_creation_time)}', '${esc(control_delivery_time)}',
       '${esc(control_delivery_result)}', '${esc(JSON.stringify(control_message))}', '${esc(delivery_status)}', ${
         delivery_error ? `'${esc(delivery_error)}'` : "NULL"
       });
  `;
    await model.postgres.sendQuery({ sql });

    return control_delivery_result;
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
