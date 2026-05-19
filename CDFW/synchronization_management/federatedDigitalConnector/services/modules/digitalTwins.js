const axios = require("axios");
const Model = require("../../models");
const model = new Model();
const ErrorHandler = require("../../lib/error-handler");
const lib = require("../../lib/index");
const config = require("../../config");

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

    if (!isExistID) {
      throw new ErrorHandler(
        412,
        412,
        "Unregistered digital-twin or already deleted"
      );
    }

    // 1) 트윈 하위 DO 목록
    const targetDOsSQL = `SELECT digital_object_id FROM digital_objects WHERE digital_twin_id = '${digital_twin_id}'`;
    const targetDOs = await model.postgres.selectDataS({ sql: targetDOsSQL });
    const targetDOidSet = new Set(
      targetDOs.map((r) => r.digital_object_id)
    );

    // 2) 그 DO들을 참조하는 FDO 식별
    //    - 모든 멤버 DO가 이 트윈 소속이면 safe → 브레인에서 FDO 삭제
    //    - 다른 트윈 DO가 섞여 있으면 blocking → 409로 트윈 삭제 중단
    const safeToDeleteFDOs = [];
    if (targetDOidSet.size > 0) {
      const idList = [...targetDOidSet].map((id) => `'${id}'`).join(",");
      const referencedFDOsSQL = `
        SELECT DISTINCT federated_digital_twin_id, federated_digital_object_id
        FROM fdo_compositions
        WHERE digital_object_id IN (${idList})
      `;
      const referencedFDOs = await model.postgres.selectDataS({
        sql: referencedFDOsSQL,
      });

      const blocking = [];
      for (const fdo of referencedFDOs) {
        const memberSQL = `
          SELECT digital_object_id
          FROM fdo_compositions
          WHERE federated_digital_object_id = '${fdo.federated_digital_object_id}'
            AND federated_digital_twin_id = '${fdo.federated_digital_twin_id}'
        `;
        const members = await model.postgres.selectDataS({ sql: memberSQL });
        const outsideMembers = members
          .map((m) => m.digital_object_id)
          .filter((id) => !targetDOidSet.has(id));

        if (outsideMembers.length > 0) {
          blocking.push({
            federated_digital_twin_id: fdo.federated_digital_twin_id,
            federated_digital_object_id: fdo.federated_digital_object_id,
            other_twin_digital_object_ids: outsideMembers,
          });
        } else {
          safeToDeleteFDOs.push(fdo);
        }
      }

      if (blocking.length > 0) {
        throw new ErrorHandler(
          409,
          409,
          `Cannot delete digital_twin: the following federated_digital_objects also reference digital_objects from other twins. ${JSON.stringify(
            blocking
          )}`
        );
      }
    }

    // 3) 안전한 FDO는 브레인 DELETE 엔드포인트에 위임
    //    (Kafka FS 커넥터 정리, fdo_compositions row, 카운트 갱신 등 일괄 처리)
    const brain = config.federatedDigitalBrain;
    const brainBase = `http://${brain.ip}:${brain.port}/${brain.base}`;
    for (const fdo of safeToDeleteFDOs) {
      const url = `${brainBase}/${fdo.federated_digital_twin_id}/federated-digital-objects/${fdo.federated_digital_object_id}`;
      try {
        await axios.delete(url);
      } catch (e) {
        throw new ErrorHandler(
          500,
          500,
          `Failed to delete dependent federated_digital_object ${fdo.federated_digital_object_id}: ${e.message}`
        );
      }
    }

    // 4) 그룹 HTTP 커넥터 배치 정리
    //    connectors 테이블을 단일 정보원으로 보고 connector_id별 1회 PUT/DELETE만 호출.
    //    GET을 제거해서 Kafka Connect 리밸런스 중 409 race를 회피하고,
    //    409가 떨어져도 kafkaConnectCall 내부에서 backoff 재시도함.
    const kafkaBase = `http://${config.kafka.connectHost}/connectors`;
    const twinConnectorIdsRows = await model.postgres.selectDataS({
      sql: `SELECT DISTINCT connector_id FROM connectors WHERE digital_twin_id = '${digital_twin_id}'`,
    });

    for (const { connector_id } of twinConnectorIdsRows) {
      const allRows = await model.postgres.selectDataS({
        sql: `SELECT * FROM connectors WHERE connector_id = '${connector_id}'`,
      });
      const remaining = allRows.filter(
        (r) => r.digital_twin_id !== digital_twin_id
      );

      try {
        if (remaining.length === 0) {
          // 이 connector의 멤버 전부가 대상 트윈 소속 → 전체 삭제
          await kafkaConnectCall({
            method: "delete",
            url: `${kafkaBase}/${connector_id}`,
            allow404: true,
          });
        } else {
          // 다른 트윈 멤버가 남음 → 잔여 멤버로 config PUT
          await kafkaConnectCall({
            method: "put",
            url: `${kafkaBase}/${connector_id}/config`,
            data: buildHttpGroupConfig(remaining),
          });
        }
      } catch (e) {
        // Kafka 측 정리 실패해도 DB 정리는 진행 (step 4b sweep이 다시 시도)
        logger.error(
          `[digitalTwins.delete] Kafka cleanup failed for ${connector_id}: ${e.message}`
        );
      }
    }

    // 4b) Kafka 직접 sweep — 모든 HttpSource* 커넥터를 무조건 점검.
    //     - step 4 성공 시: 새 config에 target twin 없음 → 자연스럽게 skip
    //     - step 4 실패 시: 옛 config에 target twin 남아 있음 → 재시도
    //     - DB-Kafka drift로 step 4가 진입조차 못한 경우도 여기서 잡힘
    //     PUT은 idempotent하니 중복 작업이어도 안전.
    try {
      const allConnectors = await kafkaConnectCall({
        method: "get",
        url: kafkaBase,
      });
      const httpGroupNames = (allConnectors ?? []).filter(
        (name) => typeof name === "string" && name.startsWith("HttpSource")
      );

      for (const name of httpGroupNames) {

        let cfgRes;
        try {
          cfgRes = await kafkaConnectCall({
            method: "get",
            url: `${kafkaBase}/${name}`,
            allow404: true,
          });
        } catch (e) {
          logger.error(
            `[digitalTwins.delete] sweep: get config ${name} failed: ${e.message}`
          );
          continue;
        }
        if (!cfgRes) continue;

        const cfg = cfgRes.config ?? cfgRes;
        const twinIdsField = cfg?.["digital.twin.id"];
        if (!twinIdsField) continue;
        const twinIds = String(twinIdsField).split(",");
        if (!twinIds.includes(digital_twin_id)) continue;

        // 대상 트윈 잔존 발견 → DB 기준으로 강제 reconcile
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
            `[digitalTwins.delete] sweep: reconcile ${name} failed: ${e.message}`
          );
        }
      }
    } catch (e) {
      logger.error(
        `[digitalTwins.delete] Kafka sweep failed: ${e.message}`
      );
    }

    // 5) 트윈 + 부속 자원 + connectors 일괄 정리
    const deleteSQL = [
      `DELETE FROM digital_twins WHERE digital_twin_id = '${digital_twin_id}';`,
      `DELETE FROM digital_objects WHERE digital_twin_id = '${digital_twin_id}';`,
      `DELETE FROM digital_object_data WHERE digital_twin_id = '${digital_twin_id}';`,
      `DELETE FROM digital_object_controllers WHERE digital_twin_id = '${digital_twin_id}';`,
      `DELETE FROM simulations WHERE digital_twin_id = '${digital_twin_id}';`,
      `DELETE FROM services WHERE digital_twin_id = '${digital_twin_id}';`,
      `DELETE FROM connectors WHERE digital_twin_id = '${digital_twin_id}';`,
    ].join("\n");
    await model.postgres.sendQuery({ sql: deleteSQL });

    return { delete: digital_twin_id };
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
