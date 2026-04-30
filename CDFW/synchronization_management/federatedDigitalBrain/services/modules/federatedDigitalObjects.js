const ErrorHandler = require("../../lib/error-handler");
const lib = require("../../lib/index");
const config = require("../../config");
const Model = require("../../models");
const model = new Model();
const { stringify } = require("wkt");
const total_rows = config.flink.total_rows;

class FederatedDigitalObjects {
  /**
   * @param {String} federated_digital_twin_id (required)
   * @param {String} federated_digital_object_name (required)
   * @param {String} description (optional)
   * @param {String array} keywords (required)
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
  async create(federated_digital_twin_id, params) {
    // 1. Digital Twin 존재 체크
    const isExistDtId = await model.postgres.checkIdExist({
      table: "federated_digital_twins",
      check: "federated_digital_twin_id",
      id: federated_digital_twin_id,
    });
    if (!isExistDtId) {
      throw new ErrorHandler(412, 412, "Unregistered federated digital-twin");
    }

    // 2. 파라미터 구조 분해
    const {
      federated_digital_object_identifier,
      federated_digital_object_name,
      description,
      keywords,
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

    // 3. FDO ID 생성 및 중복 체크
    const federated_digital_object_id =
      federated_digital_object_identifier || "FDO" + uuid();
    const isExistDOid = await model.postgres.checkIdExist({
      table: "federated_digital_objects",
      check: "federated_digital_object_id",
      id: federated_digital_object_id,
      federated_digital_twin_id,
    });
    if (isExistDOid) {
      throw new ErrorHandler(
        412,
        412,
        "federated_digital_object_id already in use",
      );
    }

    // 4. Digital Twin 정보 조회
    const selectDTsql = `SELECT * FROM federated_digital_twins WHERE federated_digital_twin_id = '${federated_digital_twin_id}'`;
    const selectedDTdata = await model.postgres.selectData({
      sql: selectDTsql,
    });
    const FDOcount =
      parseInt(selectedDTdata.number_of_federated_digital_objects) + 1;

    // 5. 타임싱크 조건 검증
    if (!config.setWindowDOtable.term.includes(time_sync_cond.time_interval)) {
      throw new ErrorHandler(
        412,
        412,
        `time_interval Error: ${JSON.stringify(
          time_sync_cond,
        )} is not present in Window setting config`,
      );
    }

    //빈 FDO 생성을 허용하지 않는 경우, member_digital_twin_object_ids가 비어있으면 에러 처리
    // if (
    //   !Array.isArray(member_digital_twin_object_ids) ||
    //   member_digital_twin_object_ids.length === 0
    // ) {
    //   throw new ErrorHandler(
    //     412,
    //     412,
    //     "member_digital_twin_object_ids must contain at least one digital_object_id",
    //   );
    // }

    // 6. 멤버 DO 정보 일괄 조회 및 캐싱
    const doInfoList = await Promise.all(
      member_digital_twin_object_ids.map(async (id) => {
        const sql = `
          SELECT digital_object_id, digital_twin_id, do_metadata,
                 digital_object_data_source_type, digital_object_data_source_url, digital_object_control_url
          FROM digital_objects
          WHERE digital_object_id = '${id}'
        `;
        const row = await model.postgres.selectData({ sql });
        if (!row || !row.digital_object_id) {
          return {
            input_id: id, // 원본 입력값 보존
            id: null,
          };
        }

        return {
          input_id: id,
          id: row.digital_object_id,
          dtid: row.digital_twin_id,
          do_metadata: row.do_metadata,
          type: row.digital_object_data_source_type,
          url: row.digital_object_data_source_url,
          control_url: row.digital_object_control_url,
        };
      }),
    );

    // 7. [존재 체크] DO 정보 없을 때
    const invalidIds = doInfoList.filter((x) => !x?.id).map((x) => x.input_id);

    if (invalidIds.length > 0) {
      throw new ErrorHandler(
        412,
        412,
        `Unregistered digital_twin object(s). ` +
          `The following values in 'member_digital_twin_object_ids' are not registered: ` +
          `[${invalidIds.join(", ")}]`,
      );
    }

    // 8. [중복 검증] 센서 중복, POLL URL 중복 (두 검증 모두 member가 2개 이상일 때만)
    if (member_digital_twin_object_ids.length > 1) {
      // DO ID → DT ID 매핑
      const doIdToDtId = {};
      for (const doInfo of doInfoList) {
        doIdToDtId[doInfo.id] = doInfo.dtid;
      }

      // 8-1. 센서 중복 체크 (DT-DO전체 기준)
      const sensorMap = {};
      for (const doInfo of doInfoList) {
        const sensors = Array.isArray(doInfo.do_metadata?.sensors)
          ? doInfo.do_metadata.sensors.map((s) => s.sensor_id)
          : [];
        for (const sensorId of sensors) {
          if (!sensorId) continue;
          if (!sensorMap[sensorId]) sensorMap[sensorId] = [];
          sensorMap[sensorId].push(doInfo.id);
        }
      }

      for (const sensorId in sensorMap) {
        const ids = sensorMap[sensorId];
        if (ids.length > 1) {
          // 중복된 DO들을 DT별로 그룹화
          const dtGroup = {};
          for (const doId of ids) {
            const dtId = doIdToDtId[doId];
            if (!dtGroup[dtId]) dtGroup[dtId] = [];
            dtGroup[dtId].push(doId);
          }

          const msg = Object.entries(dtGroup)
            .map(
              ([dtId, doIds]) =>
                `디지털트윈 ${dtId}의 디오 ${doIds.join(
                  ", ",
                )}에 중복되는 센서 ${sensorId}가 존재함`,
            )
            .join(" / ");

          throw new ErrorHandler(412, 412, msg);
        }
      }

      // 8-2. POLL 타입 data_source_url 중복 체크 (전체 기준)
      const urlMap = {};
      for (const doInfo of doInfoList) {
        if (doInfo.type === "POLL" && doInfo.url) {
          if (!urlMap[doInfo.url]) urlMap[doInfo.url] = [];
          urlMap[doInfo.url].push(doInfo.id);
        }
      }

      const urlDuplicates = Object.entries(urlMap).filter(
        ([, ids]) => ids.length > 1,
      );
      if (urlDuplicates.length > 0) {
        const dupMsg = urlDuplicates
          .map(([url, ids]) => {
            // DT별로 그룹화
            const dtGroup = {};
            for (const doId of ids) {
              const dtId = doIdToDtId[doId]; // 상단에 이미 doIdToDtId 선언되어 있어야 함
              if (!dtGroup[dtId]) dtGroup[dtId] = [];
              dtGroup[dtId].push(doId);
            }

            return Object.entries(dtGroup)
              .map(
                ([dtId, doIds]) =>
                  `디지털트윈 ${dtId}의 디오 ${doIds.join(
                    ", ",
                  )}에 중복되는 data_source_url ${url}가 존재함`,
              )
              .join(" / ");
          })
          .join(" / ");

        throw new ErrorHandler(412, 412, dupMsg);
      }

      // 8-3. CONTROL URL 중복 체크
      const controlUrlMap = {};

      // 🔹 유효한 URL 체크 함수 추가
      function isValidControlUrl(url) {
        if (!url) return false;
        if (typeof url !== "string") return false;

        const normalized = url.trim().toLowerCase();

        return (
          normalized !== "" &&
          normalized !== "null" &&
          normalized !== "undefined"
        );
      }

      for (const doInfo of doInfoList) {
        if (!isValidControlUrl(doInfo.control_url)) continue;

        const url = doInfo.control_url.trim();

        if (!controlUrlMap[url]) controlUrlMap[url] = [];
        controlUrlMap[url].push(doInfo.id);
      }

      const controlDuplicates = Object.entries(controlUrlMap).filter(
        ([, ids]) => ids.length > 1,
      );

      if (controlDuplicates.length > 0) {
        const dupMsg = controlDuplicates
          .map(([url, ids]) => {
            // DT별로 그룹핑
            const dtGroup = {};
            for (const doId of ids) {
              const dtId = doIdToDtId[doId];
              if (!dtGroup[dtId]) dtGroup[dtId] = [];
              dtGroup[dtId].push(doId);
            }

            return Object.entries(dtGroup)
              .map(
                ([dtId, doIds]) =>
                  `디지털트윈 ${dtId}의 디오 ${doIds.join(
                    ", ",
                  )}에 중복되는 object_control_url ${url}가 존재함`,
              )
              .join(" / ");
          })
          .join(" / ");

        throw new ErrorHandler(412, 412, dupMsg);
      }
    }

    // 9. [POLL 연결성 검증] 모든 POLL 타입에 대해 ping 체크
    await Promise.all(
      doInfoList.map(async (doInfo) => {
        if (doInfo.type === "POLL" && doInfo.url) {
          try {
            const resp = await axios.get(doInfo.url, { timeout: 5000 });
            if (resp.status < 200 || resp.status >= 400) throw new Error();
          } catch (e) {
            throw new ErrorHandler(
              412,
              412,
              `digital_object_data_source_url "${doInfo.url}" is not reachable for digital_object_id: ${doInfo.id}`,
            );
          }
        }
      }),
    );

    // 10. 구성/동기화/삽입 쿼리 생성 및 실행 (기존 구조 유지)
    const creationTime = lib.timestamp();
    const member_digital_twin_object_count =
      member_digital_twin_object_ids.length;

    const compositionCountQuery = `SELECT MAX(compose_numeric_id) FROM fdo_compositions`;
    const result = await model.postgres.selectData({
      sql: compositionCountQuery,
    });
    const currentCount = parseInt(result.max);

    if (total_rows !== 0 && currentCount >= total_rows) {
      throw new ErrorHandler(
        412,
        412,
        `Exceeded configured DO composition row limit (${total_rows}). ` +
          `Current count: ${currentCount}. Please update 'config.flink.total_rows' and restart Flink + DigitalBrain to regenerate Flink jobs.`,
      );
    }

    // compose_numeric_id 최대값 조회 및 1 증가
    const maxComposeIdQuery = `SELECT COALESCE(MAX(compose_numeric_id), 0) AS max_id FROM fdo_compositions`;
    const composeNumericId =
      parseInt(
        (await model.postgres.selectData({ sql: maxComposeIdQuery })).max_id,
      ) + 1;

    let compose_sql = "";
    for (let i = 0; i < member_digital_twin_object_count; i++) {
      compose_sql += `INSERT INTO fdo_compositions (compose_id, compose_numeric_id, federated_digital_twin_id, federated_digital_object_id, digital_object_id, rowtime, digital_object_count) VALUES ('CP${uuid()}', ${composeNumericId}, '${federated_digital_twin_id}', '${federated_digital_object_id}', '${
        member_digital_twin_object_ids[i]
      }', '${creationTime}', ${member_digital_twin_object_count});`;
    }

    const timeSyncInteger = time_sync_cond.time_interval;
    let spatialSyncWkt;
    try {
      spatialSyncWkt = spatial_sync_cond
        ? stringify(spatial_sync_cond)
        : "POLYGON EMPTY";
    } catch (error) {
      throw new ErrorHandler(
        412,
        412,
        "spatial_sync_cond requires a valid GeoJSON Feature or geometry object as input",
      );
    }

    const synComposeSQL = `INSERT INTO fdo_sync_compositions (compose_id, federated_digital_twin_id, federated_digital_object_id, time_sync, spatial_sync, rowtime) VALUES ('CP${uuid()}', '${federated_digital_twin_id}', '${federated_digital_object_id}', ${timeSyncInteger}, '${spatialSyncWkt}', '${creationTime}');`;
    const insert_sql = `INSERT INTO federated_digital_objects (
                           federated_digital_object_id,
                           federated_digital_twin_id,
                           federated_digital_object_name,
                           description,
                           keywords,
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
                        ) VALUES ('${federated_digital_object_id}', '${federated_digital_twin_id}', '${federated_digital_object_name}', '${description}', '{${keywords}}', '${access_url}', '${access_protocol}', '${creationTime}', '${creator_id}', '${creationTime}',
                          '${JSON.stringify(location)}', '${JSON.stringify(
                            time_sync_cond,
                          )}', '${JSON.stringify(spatial_sync_cond)}',
                          ${member_digital_twin_object_count},'{${member_digital_twin_object_ids}}','${data_model_id}', 
                            '${JSON.stringify(preliminary_field)}');`;

    let insertRelationsSQL = "";
    insertRelationsSQL += await model.postgres.createinsertRelationSQL({
      parent_id: federated_digital_twin_id,
      resource_id: federated_digital_object_id,
      type: config.type.federatedDigitalObject,
    });
    insertRelationsSQL += await model.postgres.createinsertRelationSQL({
      parent_id: federated_digital_object_id,
      resource_id: member_digital_twin_object_ids,
      type: config.type.digitalObject,
    });
    insertRelationsSQL += await model.postgres.createinsertRelationSQL({
      parent_id: federated_digital_object_id,
      resource_id: data_model_id,
      type: config.type.dataModel,
    });
    //await model.postgres.sendQuery({ sql: insertRelationsSQL });

    const updateFDOcountSQL = `UPDATE federated_digital_twins SET number_of_federated_digital_objects = ${FDOcount}, modification_time = '${lib.timestamp()}' WHERE federated_digital_twin_id = '${federated_digital_twin_id}';`;
    await model.postgres.sendQuery({
      sql:
        insert_sql +
        compose_sql +
        synComposeSQL +
        insertRelationsSQL +
        updateFDOcountSQL,
    });

    return { federated_digital_object_id };
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
        412,
        "Unregistered federated-digital-objects",
      );
    }
  }

  /**
   * 저장된 federated-digitalObjects 검색
   * @param {string} name
   * @returns {Json}
   */
  async Search({ federated_digital_twin_id, name }) {
    const isExistName = await model.postgres.checkNameExist({
      table: "federated_digital_objects",
      check: "federated_digital_object_name",
      name: name,
      federated_digital_twin_id,
    });

    if (isExistName) {
      const sql = `select * from federated_digital_objects where federated_digital_object_name = '${name}' and federated_digital_twin_id = '${federated_digital_twin_id}'`;
      const selectedData = await model.postgres.selectDataS({ sql });
      return selectedData;
    } else {
      throw new ErrorHandler(
        412,
        412,
        "Unregistered federated-digital-objects",
      );
    }
  }

  /**
   * @param {String} federated_digital_twin_id (required)
   * @param {String} federated_digital_object_id DO id(required)
   * @param {String} federated_digital_object_name DO name(required)
   * * @param {String} description (optional)
   * * @param {String} keywords (required)
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
      throw new ErrorHandler(412, 412, "Unregistered federated_digital_object");
    } else {
      const whereClause = `where federated_digital_object_id = '${id}' and federated_digital_twin_id = '${federated_digital_twin_id}';`;
      let sql = `update federated_digital_objects set `;
      for (let key in params) {
        if (key === "member_digital_twin_object_ids") {
          //string array type
          for (let i in params[key]) {
            let isExistID = await model.postgres.checkIdExist({
              table: "digital_objects",
              check: "digital_object_id",
              id: params[key][i],
            });
            if (!isExistID) {
              throw new ErrorHandler(
                412,
                412,
                "Unregistered digital_twin object in FDO",
              );
            }
          }
          sql += `${key} = '{${lib.arryToEnum(
            params[key],
          )}}',  member_digital_twin_object_count = ${params[key].length}, `;
        } else if (key === "keywords") {
          sql += `${key} = '{${params[key]}}', `;
        } else if (
          //json type
          key === "location" ||
          key === "spatial_sync_cond" ||
          key === "preliminary_field"
        ) {
          sql += `${key} = '${JSON.stringify(params[key])}', `;
        } else if (key === "time_sync_cond") {
          if (
            !config.setWindowDOtable.term.includes(
              params.time_sync_cond.time_interval,
            )
          ) {
            throw new ErrorHandler(
              412,
              412,
              `time_interval Error: ${JSON.stringify(
                params.time_sync_cond,
              )} is not present in Window setting config`,
            );
          } else {
            sql += `${key} = '${JSON.stringify(params[key])}', `;
          }
        } else {
          //string type
          sql += `${key} = '${params[key]}', `;
        }
      }
      sql += ` modification_time='${lib.timestamp()}' ${whereClause}`;
      await model.postgres.sendQuery({ sql });

      if (params.member_digital_twin_object_ids) {
        // 1. 멤버 DO 정보 일괄 조회
        const doInfoList = await Promise.all(
          params.member_digital_twin_object_ids.map(async (id) => {
            const sql = `
        SELECT digital_object_id, digital_twin_id, do_metadata,
               digital_object_data_source_type, digital_object_data_source_url
        FROM digital_objects
        WHERE digital_object_id = '${id}'
      `;
            const row = await model.postgres.selectData({ sql });
            return {
              id: row.digital_object_id,
              dtid: row.digital_twin_id,
              do_metadata: row.do_metadata,
              type: row.digital_object_data_source_type,
              url: row.digital_object_data_source_url,
            };
          }),
        );

        // 2. 존재 체크
        for (const doInfo of doInfoList) {
          if (!doInfo.id) {
            throw new ErrorHandler(
              412,
              412,
              `Unregistered digital_twin object: ${doInfo.id}`,
            );
          }
        }

        // 3. 센서 중복 체크
        if (params.member_digital_twin_object_ids.length > 1) {
          const dtMap = {};
          for (const doInfo of doInfoList) {
            if (!dtMap[doInfo.dtid]) dtMap[doInfo.dtid] = [];
            dtMap[doInfo.dtid].push(doInfo);
          }
          for (const dtId in dtMap) {
            const doList = dtMap[dtId];
            if (doList.length > 1) {
              const sensorMap = {};
              for (const doInfo of doList) {
                const sensors = Array.isArray(doInfo.do_metadata?.sensors)
                  ? doInfo.do_metadata.sensors.map((s) => s.sensor_id)
                  : [];
                for (const sensorId of sensors) {
                  if (!sensorId) continue;
                  if (!sensorMap[sensorId]) sensorMap[sensorId] = [];
                  sensorMap[sensorId].push(doInfo.id);
                }
              }
              for (const sensorId in sensorMap) {
                if (sensorMap[sensorId].length > 1) {
                  throw new ErrorHandler(
                    412,
                    412,
                    `디지털트윈 ${dtId}의 디오 ${sensorMap[sensorId].join(
                      ", ",
                    )}에 중복되는 센서 ${sensorId}가 존재함`,
                  );
                }
              }
            }
          }

          // 4. POLL 타입 data_source_url 중복 체크
          const urlMap = {};
          for (const doInfo of doInfoList) {
            if (doInfo.type === "POLL" && doInfo.url) {
              if (!urlMap[doInfo.url]) urlMap[doInfo.url] = [];
              urlMap[doInfo.url].push(doInfo.id);
            }
          }
          const duplicates = Object.entries(urlMap).filter(
            ([, ids]) => ids.length > 1,
          );
          if (duplicates.length > 0) {
            const dupMsg = duplicates
              .map(
                ([url, ids]) =>
                  `디지털 객체 ${ids.join(
                    ", ",
                  )}가 중복된 data_source_url(${url})을 가지고 있습니다.`,
              )
              .join(" / ");
            throw new ErrorHandler(412, 412, dupMsg);
          }
        }

        // 5. POLL 타입 reachable 체크
        await Promise.all(
          doInfoList.map(async (doInfo) => {
            if (doInfo.type === "POLL" && doInfo.url) {
              try {
                const resp = await axios.get(doInfo.url, { timeout: 5000 });
                if (resp.status < 200 || resp.status >= 400) throw new Error();
              } catch (e) {
                throw new ErrorHandler(
                  412,
                  412,
                  `digital_object_data_source_url "${doInfo.url}" is not reachable for digital_object_id: ${doInfo.id}`,
                );
              }
            }
          }),
        );
        // 6. DO 구성 정보 업데이트
        const deleteDOcomposeSQL = `delete from fdo_compositions ${whereClause}`;
        let compose_sql = "";
        for (let i = 0; i < params.member_digital_twin_object_ids.length; i++) {
          compose_sql += `INSERT INTO fdo_compositions (compose_id, federated_digital_twin_id, federated_digital_object_id, digital_object_id, rowtime) VALUES ('CP${uuid()}', '${federated_digital_twin_id}', '${id}', '${
            params.member_digital_twin_object_ids[i]
          }', '${lib.timestamp()}');`;
        }
        await model.postgres.sendQuery({
          sql: deleteDOcomposeSQL + compose_sql,
        });
      }

      let synComposeSQL = "";
      if (params.time_sync_cond && params.spatial_sync_cond) {
        // Both time_sync_cond and spatial_sync_cond exist
        const timeSyncInteger = params.time_sync_cond.time_interval;
        let spatialSyncWkt;
        try {
          spatialSyncWkt = params.spatial_sync_cond
            ? stringify(params.spatial_sync_cond)
            : "POLYGON EMPTY";
        } catch (error) {
          throw new ErrorHandler(
            412,
            412,
            "spatial_sync_cond requires a valid GeoJSON Feature or geometry object as input",
          );
        }

        synComposeSQL = `update fdo_sync_compositions set time_sync=${timeSyncInteger}, spatial_sync='${spatialSyncWkt}' ${whereClause}`;
      } else if (params.time_sync_cond && !params.spatial_sync_cond) {
        // Only time_sync_cond exists
        const timeSyncInteger = params.time_sync_cond.time_interval;

        synComposeSQL = `update fdo_sync_compositions set time_sync=${timeSyncInteger} ${whereClause}`;
      } else if (!params.time_sync_cond && params.spatial_sync_cond) {
        // Only spatial_sync_cond exists
        let spatialSyncWkt;
        try {
          spatialSyncWkt = params.spatial_sync_cond
            ? stringify(params.spatial_sync_cond)
            : "POLYGON EMPTY";
        } catch (error) {
          throw new ErrorHandler(
            412,
            412,
            "spatial_sync_cond requires a valid GeoJSON Feature or geometry object as input",
          );
        }
        synComposeSQL = `update fdo_sync_compositions set spatial_sync='${spatialSyncWkt}' ${whereClause}`;
      }

      return { update: id };
    }
  }

  /**
   * 저장된 FDO 삭제
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
      throw new ErrorHandler(412, 412, "Unregistered federated_digital_object");
    }

    // ----- FDO와 연결된 FS 커넥터 삭제 -----
    await model.kafka.deleteFSConnectorByFdoId(id);

    // ----- FDO 관련 데이터 삭제 -----
    const selectFDTsql = `select * from federated_digital_twins where federated_digital_twin_id = '${federated_digital_twin_id}'`;
    const selectedFDTdata = await model.postgres.selectData({
      sql: selectFDTsql,
    });
    const FDOcount =
      parseInt(selectedFDTdata.number_of_federated_digital_objects) - 1;
    const updateFDOcountSQL = `update federated_digital_twins set number_of_federated_digital_objects = ${FDOcount}, modification_time = '${lib.timestamp()}' where federated_digital_twin_id = '${federated_digital_twin_id}';`;
    const deleteRelationSQL = `delete from relations where resource_id = '{${id}}' or parent_id = '${id}';`;
    const deleteObjectSQL = `delete from federated_digital_objects where federated_digital_object_id = '${id}' and federated_digital_twin_id = '${federated_digital_twin_id}'; delete from federated_digital_object_data where federated_digital_object_id= '${id}' and federated_digital_twin_id = '${federated_digital_twin_id}';`;
    const deleteFDOcomposeSQL = `delete from fdo_compositions where federated_digital_object_id = '${id}' and federated_digital_twin_id = '${federated_digital_twin_id}'; delete from fdo_sync_compositions where federated_digital_object_id = '${id}' and federated_digital_twin_id = '${federated_digital_twin_id}';`;

    await model.postgres.sendQuery({
      sql:
        updateFDOcountSQL +
        deleteRelationSQL +
        deleteObjectSQL +
        deleteFDOcomposeSQL,
    });

    return { delete: id };
  }

  /**
   * federated_digital_object data 조회
   * @param {string} federated_digital_twin_id
   * @param {string} id digital_object_id
   * @param {string} from startDateTime
   * @param {string} to endDateTime
   * @returns {Json} 기간별 조회
   */
  async getData({
    federated_digital_twin_id,
    id,
    from,
    to,
    count,
    window,
    offset = 0,
  }) {
    const isExistID = await model.postgres.checkIdExist({
      table: "federated_digital_objects",
      check: "federated_digital_object_id",
      id,
      federated_digital_twin_id,
    });
    if (!isExistID) {
      throw new ErrorHandler(412, 412, "Unregistered federated_digital_object");
    }

    const getBaseSql = async (window) => {
      if (window) {
        if (!config.setWindowDOtable.term.includes(parseInt(window))) {
          throw new ErrorHandler(
            412,
            412,
            `time_interval Error: ${window} is not present in Window setting config`,
          );
        }
        return `SELECT * FROM federated_digital_object_window_data_${window} WHERE federated_digital_twin_id='${federated_digital_twin_id}' AND federated_digital_object_id = '${id}'`;
      } else {
        return `SELECT * FROM federated_digital_object_data WHERE federated_digital_twin_id='${federated_digital_twin_id}' AND federated_digital_object_id = '${id}'`;
      }
    };

    let sql = await getBaseSql(window);

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

    sql += ";";
    return await model.postgres.selectDataS({ sql });
  }

  /**
   * 저장된 모든 DO의 이름 조회
   * @returns {List}
   */
  async getAll({ federated_digital_twin_id }) {
    const sql = `select * from federated_digital_objects where federated_digital_twin_id = '${federated_digital_twin_id}';`;
    const FDOentireList = await model.postgres.selectDataS({ sql });

    return FDOentireList;
  }

  /// ----- Control 관련 유틸 함수 -----

  /**
   * 제어 알림에서 허용하는 이벤트 타입 정의
   */
  getControlNotificationEventTypes() {
    return [
      "CONTROL_NO_ACK",
      "CONTROL_DELIVERY_FAILED",
      "CONTROL_FAILED",
      "CONTROL_TIMEOUT",
      "CONTROL_SUCCEEDED",
    ];
  }

  /**
   * 동일 제어 이벤트에 대한 알림 중복 적재 방지 key 생성
   */
  buildControlNotificationEventKey({
    federated_digital_object_id,
    federated_digital_object_control_data_id,
    digital_object_id,
    event_type,
  }) {
    return [
      federated_digital_object_id,
      federated_digital_object_control_data_id,
      digital_object_id || "ALL",
      event_type,
    ].join(":");
  }

  /**
   * 문자열 SQL escape 최소 처리
   */
  escapeSqlValue(value) {
    return String(value ?? "").replace(/'/g, "''");
  }

  /**
   * FDO 제어 알림 구독 등록
   */
  async createControlNotification(
    federated_digital_twin_id,
    federated_digital_object_id,
    params,
  ) {
    const esc = this.escapeSqlValue;

    const {
      digital_object_id = null,
      event_type,
      target_type = "WEBHOOK",
      target_endpoint,
      description = null,
    } = params || {};

    const allowedEventTypes = this.getControlNotificationEventTypes();

    if (!federated_digital_twin_id || !federated_digital_object_id) {
      throw new ErrorHandler(412, 5252, "please check mandatory field.");
    }

    if (!event_type || !allowedEventTypes.includes(event_type)) {
      throw new ErrorHandler(
        412,
        5252,
        `event_type must be one of: ${allowedEventTypes.join(", ")}`,
      );
    }

    if (!target_endpoint) {
      throw new ErrorHandler(412, 5252, "target_endpoint is required.");
    }

    const isExistFDO = await model.postgres.checkIdExist({
      table: "federated_digital_objects",
      check: "federated_digital_object_id",
      id: federated_digital_object_id,
      federated_digital_twin_id,
    });

    if (!isExistFDO) {
      throw new ErrorHandler(
        412,
        5252,
        "Unregistered federated_digital_object",
      );
    }

    if (digital_object_id) {
      const { member_digital_twin_object_ids } = await this.Retrieve({
        federated_digital_twin_id,
        federated_digital_object_id,
      });

      if (!member_digital_twin_object_ids.includes(digital_object_id)) {
        throw new ErrorHandler(
          412,
          5252,
          `'${digital_object_id}' is not a member digital_object of this FDO.`,
        );
      }
    }

    const sql = `
      INSERT INTO control_notification_subscriptions (
        federated_digital_object_id,
        digital_object_id,
        event_type,
        target_type,
        target_endpoint,
        description
      )
      VALUES (
        '${esc(federated_digital_object_id)}',
        ${digital_object_id ? `'${esc(digital_object_id)}'` : "NULL"},
        '${esc(event_type)}',
        '${esc(target_type)}',
        '${esc(target_endpoint)}',
        ${description ? `'${esc(description)}'` : "NULL"}
      )
      RETURNING *;
    `;

    return await model.postgres.selectData({ sql });
  }

  /**
   * FDO 제어 알림 구독 조회
   */
  async searchControlNotifications({
    federated_digital_twin_id,
    federated_digital_object_id,
  }) {
    if (!federated_digital_twin_id || !federated_digital_object_id) {
      throw new ErrorHandler(412, 5252, "please check mandatory field.");
    }

    const isExistFDO = await model.postgres.checkIdExist({
      table: "federated_digital_objects",
      check: "federated_digital_object_id",
      id: federated_digital_object_id,
      federated_digital_twin_id,
    });

    if (!isExistFDO) {
      throw new ErrorHandler(
        412,
        5252,
        "Unregistered federated_digital_object",
      );
    }

    const sql = `
      SELECT *
      FROM control_notification_subscriptions
      WHERE federated_digital_object_id = '${this.escapeSqlValue(
        federated_digital_object_id,
      )}'
      ORDER BY subscription_id DESC;
    `;

    return await model.postgres.selectDataS({ sql });
  }

  /**
   * FDO 제어 알림 구독 수정
   */
  async updateControlNotification({
    federated_digital_twin_id,
    federated_digital_object_id,
    subscription_id,
    params,
  }) {
    const esc = this.escapeSqlValue;

    if (!federated_digital_twin_id || !federated_digital_object_id) {
      throw new ErrorHandler(412, 5252, "please check mandatory field.");
    }

    const updates = [];

    if (typeof params?.is_enabled === "boolean") {
      updates.push(`is_enabled = ${params.is_enabled}`);
    }

    if (typeof params?.target_endpoint === "string") {
      updates.push(`target_endpoint = '${esc(params.target_endpoint)}'`);
    }

    if (typeof params?.description === "string") {
      updates.push(`description = '${esc(params.description)}'`);
    }

    if (updates.length === 0) {
      throw new ErrorHandler(412, 5252, "No update fields provided.");
    }

    updates.push("updated_at = NOW()");

    const sql = `
      UPDATE control_notification_subscriptions
      SET ${updates.join(", ")}
      WHERE subscription_id = ${parseInt(subscription_id)}
        AND federated_digital_object_id = '${esc(federated_digital_object_id)}'
      RETURNING *;
    `;

    const result = await model.postgres.selectData({ sql });

    if (!result || !result.subscription_id) {
      throw new ErrorHandler(404, 404, "Control notification not found.");
    }

    return result;
  }
  /**
   * Purpose: 상태 전이 결과를 알림 outbox에 중복 없이 적재
   */
  async enqueueControlNotificationEvent({
    federated_digital_object_id,
    federated_digital_object_control_data_id,
    digital_object_id = null,
    event_type,
    payload,
  }) {
    const esc = this.escapeSqlValue;
    const allowedEventTypes = this.getControlNotificationEventTypes();

    if (!allowedEventTypes.includes(event_type)) {
      throw new ErrorHandler(
        412,
        5252,
        `Unsupported control notification event_type: ${event_type}`,
      );
    }

    const event_key = this.buildControlNotificationEventKey({
      federated_digital_object_id,
      federated_digital_object_control_data_id,
      digital_object_id,
      event_type,
    });

    const sql = `
      INSERT INTO control_notification_outbox (
        event_key,
        federated_digital_object_id,
        federated_digital_object_control_data_id,
        digital_object_id,
        event_type,
        payload,
        send_status
      )
      VALUES (
        '${esc(event_key)}',
        '${esc(federated_digital_object_id)}',
        '${esc(federated_digital_object_control_data_id)}',
        ${digital_object_id ? `'${esc(digital_object_id)}'` : "NULL"},
        '${esc(event_type)}',
        '${esc(JSON.stringify(payload))}'::jsonb,
        'PENDING'
      )
      ON CONFLICT (event_key) DO NOTHING
      RETURNING *;
    `;

    return await model.postgres.selectData({ sql });
  }

  /**
   * PENDING/SENT 상태의 제어 결과 중 timeout 조건을 만족하는 row를 TIMEOUT으로 확정하고 알림 outbox 적재
   * Usage: setInterval 또는 별도 scheduler에서 주기적으로 호출
   */
  async markTimeoutControlResults() {
    const sql = `
      SELECT
        r.federated_digital_object_id,
        r.federated_digital_object_control_data_id,
        r.digital_object_id,
        c.federated_digital_object_control_creation_time,
        d.digital_object_control_execution_timeout
      FROM federated_control_result r
      JOIN federated_controls c
        ON c.federated_digital_object_id = r.federated_digital_object_id
       AND c.federated_digital_object_control_data_id =
           r.federated_digital_object_control_data_id
      JOIN digital_objects d
        ON d.digital_object_id = r.digital_object_id
      WHERE r.control_status IN ('PENDING', 'SENT')
        AND r.federated_digital_object_control_execution_result IS NULL
        AND NOW() >
          c.federated_digital_object_control_creation_time
          + ((COALESCE(d.digital_object_control_execution_timeout, 60000)) || ' milliseconds')::interval;
    `;

    const rows = await model.postgres.selectDataS({ sql });
    const updated = [];

    for (const row of rows) {
      const updateSql = `
        UPDATE federated_control_result
        SET control_status = 'TIMEOUT',
            updated_at = NOW(),
            last_error = 'Control execution timed out.'
        WHERE federated_digital_object_id = '${this.escapeSqlValue(
          row.federated_digital_object_id,
        )}'
          AND federated_digital_object_control_data_id = '${this.escapeSqlValue(
            row.federated_digital_object_control_data_id,
          )}'
          AND digital_object_id = '${this.escapeSqlValue(row.digital_object_id)}'
          AND control_status IN ('PENDING', 'SENT');
      `;

      await model.postgres.sendQuery({ sql: updateSql });

      await this.enqueueControlNotificationEvent({
        federated_digital_object_id: row.federated_digital_object_id,
        federated_digital_object_control_data_id:
          row.federated_digital_object_control_data_id,
        digital_object_id: row.digital_object_id,
        event_type: "CONTROL_TIMEOUT",
        payload: {
          federated_digital_object_id: row.federated_digital_object_id,
          federated_digital_object_control_data_id:
            row.federated_digital_object_control_data_id,
          digital_object_id: row.digital_object_id,
          status: "TIMEOUT",
          control_execution_result: null,
          last_error: "Control execution timed out.",
          execution_timeout_ms:
            row.digital_object_control_execution_timeout || 60000,
        },
      });

      updated.push({
        federated_digital_object_id: row.federated_digital_object_id,
        federated_digital_object_control_data_id:
          row.federated_digital_object_control_data_id,
        digital_object_id: row.digital_object_id,
        status: "TIMEOUT",
      });
    }

    return updated;
  }

  /**
   * FederatedDigitalObjects - Control 확장판 (DO와 동일 규격)
   * @param {String} federated_digital_twin_id (required)
   * @param {String} federated_digital_object_id DO id(required)
   * @param {Json} control
   *   - commands: [ { digital_object_id, command_name, parameters } , ... ] (required)
   *   - federated_digital_object_control_data_id (optional)
   * @returns {Json} {}
   *
   * 1) createControl()
   *   - 각 DO로 control 전달 시 DO별 delivery_timeout 적용 (digital_object_control_delivery_timeout)
   *   - DO별 delivery_status / delivery_error 계산 (DELIVERED / NO_ACK / DELIVERY_FAILED)
   *   - federated_controls에는 commands 원문 + DO별 delivery meta를 함께 저장
   *   - federated_control_result row 생성 시:
   *       control_status = 'PENDING'
   *       attempt_count = 1
   *       updated_at = NOW()
   *       last_error = NULL
   *     + 중복( uq_fcr_fdo_do )이면 409 + 메시지: "The control ID already exists (PENDING or SENT) and cannot be duplicated."
   *
   * 2) createFDOExecutionData()
   *   - DB를 직접 업데이트하지 않음 (Kafka 이벤트만 발행)
   *
   * 3) searchControl()
   *   - 기존 control_status(SUCCEEDED/TIMEOUT/PENDING) 계산 유지 (delivery_timeout은 status 반영 X)
   *   - DO별 delivery_status / delivery_error 함께 리턴
   */

  async createControl(
    federated_digital_twin_id,
    federated_digital_object_id,
    params,
  ) {
    const esc = (v) => String(v ?? "").replace(/'/g, "''");

    const federated_digital_object_control_creation_time = lib.timestamp();
    const control_messages = params || {};
    const federated_digital_object_control_data_id =
      control_messages.federated_digital_object_control_data_id
        ? control_messages.federated_digital_object_control_data_id
        : "FDOC" + uuid();

    if (!federated_digital_twin_id || !federated_digital_object_id) {
      throw new ErrorHandler(412, 5252, "please check mandatory field.");
    }

    if (
      !Array.isArray(control_messages.commands) ||
      control_messages.commands.length === 0
    ) {
      throw new ErrorHandler(
        412,
        5252,
        '"commands" must be an array and contain at least one element.',
      );
    }

    // FDO 존재 확인
    const isExistFDO = await model.postgres.checkIdExist({
      table: "federated_digital_objects",
      check: "federated_digital_object_id",
      id: federated_digital_object_id,
    });
    if (!isExistFDO) {
      throw new ErrorHandler(
        412,
        5252,
        "Unregistered federated_digital_object",
      );
    }

    // FDO 멤버 DO 목록 확인
    const { member_digital_twin_object_ids } = await this.Retrieve({
      federated_digital_twin_id,
      federated_digital_object_id,
    });

    // commands 중복 방지 + 유효성 체크
    const seen = new Set();
    for (const command of control_messages.commands) {
      const key = command.digital_object_id;
      if (seen.has(key)) {
        throw new ErrorHandler(
          412,
          5252,
          "'commands' must not contain duplicate digital_object_id combinations.",
        );
      }
      seen.add(key);

      const doid = command.digital_object_id;
      if (!member_digital_twin_object_ids.includes(doid)) {
        throw new ErrorHandler(
          412,
          5252,
          `'${doid}' is unregistered digital_object`,
        );
      }

      const isValidCommand = await model.ajv.checkCommandValid({ command });
      if (isValidCommand !== "true") {
        throw new ErrorHandler(
          412,
          5252,
          `Invalid property '${command}' : ${isValidCommand} `,
        );
      }
    }

    /**
     * DO별 control 전달 + delivery_status/delivery_error 계산
     * - delivery_timeout: digital_objects.digital_object_control_delivery_timeout (ms)
     */
    const DEFAULT_DELIVERY_TIMEOUT_MS = 5000;

    const deliveryMetaByDo = {}; // { [doid]: { delivery_status, delivery_error, delivery_timeout_ms } }
    const returnMessage = [];

    for (const command of control_messages.commands) {
      const doid = command.digital_object_id;

      // dtid + delivery_timeout 조회
      const doRow = await model.postgres.selectData({
        sql: `
        SELECT digital_twin_id, digital_object_control_delivery_timeout
        FROM digital_objects
        WHERE digital_object_id='${esc(doid)}'
      `,
      });

      const dtid = doRow?.digital_twin_id;
      if (!dtid) {
        // 이 케이스는 원래 위에서 membership 체크 통과했어도 DB row가 없으면 터져야 함
        throw new ErrorHandler(
          412,
          5252,
          `Unregistered digital_object: ${doid}`,
        );
      }

      const deliveryTimeout =
        typeof doRow.digital_object_control_delivery_timeout === "number" &&
        doRow.digital_object_control_delivery_timeout > 0
          ? doRow.digital_object_control_delivery_timeout
          : DEFAULT_DELIVERY_TIMEOUT_MS;

      // command 보강
      const enrichedCommand = {
        ...command,
        digital_twin_id: dtid,
        federated_digital_object_control_data_id,
        federated_digital_twin_id,
        federated_digital_object_id,
      };

      let httpResponse;
      let delivery_status = "NO_ACK";
      let delivery_error = null;

      try {
        const createControlData = await lib.request({
          url: `http://${config.federatedDigitalConnector.ip}:${config.federatedDigitalConnector.port}/${config.federatedDigitalConnector.base}/digital-twins/${dtid}/digital-objects/${doid}/control`,
          bodyParams: enrichedCommand,
          timeout: deliveryTimeout,
        });

        httpResponse = createControlData?.data ?? createControlData;

        if (
          Object.prototype.toString.call(httpResponse) === "[object Object]"
        ) {
          httpResponse = JSON.stringify(httpResponse);
        }

        const normalizedHttpResponse = String(httpResponse ?? "").trim();

        if (
          !normalizedHttpResponse ||
          normalizedHttpResponse === "No controller response"
        ) {
          delivery_status = "NO_ACK";
          delivery_error = "No controller response";
          httpResponse = "No controller response";
        } else {
          delivery_status = "DELIVERED";
        }
      } catch (err) {
        delivery_status = "DELIVERY_FAILED";
        delivery_error =
          err?.code === "ECONNABORTED"
            ? `Delivery timeout (${deliveryTimeout} ms)`
            : `Delivery error: ${err?.message || String(err)}`;
        httpResponse = delivery_error;
      }

      deliveryMetaByDo[doid] = {
        delivery_status,
        delivery_error,
        delivery_timeout_ms: deliveryTimeout,
      };

      /**
       * DO 제어 전달 실패/무응답 상태를 알림 outbox에 적재
       * - NO_ACK: 응답 body가 비어있거나 컨트롤러 ACK를 받지 못한 경우
       * - DELIVERY_FAILED: timeout/network error 등 request 자체 실패
       */
      if (
        delivery_status === "NO_ACK" ||
        delivery_status === "DELIVERY_FAILED"
      ) {
        await this.enqueueControlNotificationEvent({
          federated_digital_object_id,
          federated_digital_object_control_data_id,
          digital_object_id: doid,
          event_type:
            delivery_status === "NO_ACK"
              ? "CONTROL_NO_ACK"
              : "CONTROL_DELIVERY_FAILED",
          payload: {
            federated_digital_twin_id,
            federated_digital_object_id,
            federated_digital_object_control_data_id,
            digital_object_id: doid,
            digital_twin_id: dtid,
            delivery_status,
            delivery_error,
            delivery_timeout_ms: deliveryTimeout,
            delivery_result: httpResponse,
            created_at: lib.timestamp(),
          },
        });
      }

      returnMessage.push({
        digital_object_id: doid,
        digital_twin_id: dtid,
        delivery_status,
        delivery_error,
        delivery_timeout_ms: deliveryTimeout,
        delivery_result: httpResponse,
      });
    }

    /**
     * federated_controls 저장
     * - delivery_result: returnMessage (배열)
     * - command: 원래 commands + (옵션) delivery meta도 커맨드에 함께 남길 수 있음
     */
    const federated_digital_object_control_data_creator =
      control_messages.control_data_creator
        ? control_messages.control_data_creator
        : "";

    const federated_digital_object_control_delivery_time = lib.timestamp();

    // commands 원문에 deliveryMeta를 같이 넣어 저장(조회 시 join 없이도 확인 가능)
    const commandToStore = {
      ...control_messages,
      federated_digital_object_control_data_id,
      delivery_meta_by_do: deliveryMetaByDo,
    };

    const insertControlsSql = `
    INSERT INTO federated_controls
      (federated_digital_object_control_data_id, federated_digital_twin_id, federated_digital_object_id,
       federated_digital_object_control_data_creator,
       federated_digital_object_control_creation_time, federated_digital_object_control_delivery_time,
       federated_digital_object_control_delivery_result, federated_digital_object_control_command)
    VALUES
      ('${esc(federated_digital_object_control_data_id)}', '${esc(federated_digital_twin_id)}', '${esc(federated_digital_object_id)}',
       '${esc(federated_digital_object_control_data_creator)}',
       '${esc(federated_digital_object_control_creation_time)}', '${esc(federated_digital_object_control_delivery_time)}',
       '${esc(JSON.stringify(returnMessage))}', '${esc(JSON.stringify(commandToStore))}');
  `;
    await model.postgres.sendQuery({ sql: insertControlsSql });

    /**
     * federated_control_result row 생성
     * - status=PENDING, attempt_count=1, updated_at=NOW(), last_error=NULL
     * - 중복이면 409 메시지 수정 적용
     */
    for (const message of control_messages.commands) {
      const doid = message.digital_object_id;

      const fdo_sql = `
      INSERT INTO federated_control_result
        (federated_digital_object_control_data_id, federated_digital_object_id, digital_object_id,
         federated_digital_object_control_execution_time, federated_digital_object_control_execution_result,
         control_status, attempt_count, updated_at, last_error)
      VALUES
        ('${esc(federated_digital_object_control_data_id)}', '${esc(federated_digital_object_id)}', '${esc(doid)}',
         NULL, NULL,
         'PENDING', 1, NOW(), NULL);
    `;

      try {
        await model.postgres.sendQuery({ sql: fdo_sql });
      } catch (err) {
        const isUniqueViolation = err?.code === "23505";
        const isTargetConstraint =
          err?.constraint === "uq_fcr_fdo_do" ||
          String(err?.detail || "").includes('"uq_fcr_fdo_do"') ||
          String(err?.message || "").includes("uq_fcr_fdo_do");

        if (isUniqueViolation && isTargetConstraint) {
          // 메시지 교체 적용
          throw new ErrorHandler(
            409,
            5252,
            "The control ID already exists (PENDING or SENT) and cannot be duplicated.",
          );
        }
        throw err;
      }
    }

    // 기존 응답(컨트롤러 응답 목록) + DO별 delivery_status 포함한 형태
    return returnMessage;
  }

  async createFDOExecutionData(
    federated_digital_twin_id,
    federated_digital_object_id,
    params,
  ) {
    const control_execution_time = lib.timestamp();
    const {
      federated_digital_object_control_data_id,
      digital_object_id,
      control_execution_result,
    } = params || {};

    if (!federated_digital_twin_id || !federated_digital_object_id) {
      throw new ErrorHandler(412, 5252, "please check mandatory field.");
    }

    if (!federated_digital_object_control_data_id || !digital_object_id) {
      throw new ErrorHandler(
        412,
        5252,
        "data needs federated_digital_object_control_data_id and digital_object_id.",
      );
    }

    const isExistID = await model.postgres.checkIdExist({
      table: "federated_controls",
      check: "federated_digital_object_control_data_id",
      id: federated_digital_object_control_data_id,
    });
    if (!isExistID) {
      throw new ErrorHandler(
        412,
        412,
        "Unregistered federated_digital_object_control_data_id",
      );
    }

    if (
      control_execution_result === undefined ||
      control_execution_result === null
    ) {
      throw new ErrorHandler(
        412,
        5252,
        "data needs control_execution_result field.",
      );
    }

    // Kafka에 최소 이벤트만 발행 (DB 업데이트는 Consumer에서 처리 권장)
    const fdoExecutionResultMessage = {
      federated_digital_object_id,
      digital_object_id,
      federated_digital_object_control_data_id,
      federated_digital_object_control_execution_result:
        control_execution_result,
      federated_digital_object_control_execution_time: control_execution_time,
    };

    const kafkaKey = { federated_digital_object_id };
    await model.kafka.kafkaProducer({
      topic: "fdo_control_result",
      kafkaKey: JSON.stringify(kafkaKey),
      data: JSON.stringify(fdoExecutionResultMessage),
    });

    /**
     * control-result 콜백 수신 시 실행 결과 알림 outbox 적재
     * - 기본 정책: control_execution_result 문자열에 fail/error가 포함되면 FAILED
     * - 그 외는 SUCCEEDED
     * - 추후 controller가 명시적으로 status를 보내면 params.control_status 우선 사용 가능
     */
    const normalizedResult = String(control_execution_result).toLowerCase();
    const controlStatus =
      params.control_status ||
      (normalizedResult.includes("fail") || normalizedResult.includes("error")
        ? "FAILED"
        : "SUCCEEDED");

    await this.enqueueControlNotificationEvent({
      federated_digital_object_id,
      federated_digital_object_control_data_id,
      digital_object_id,
      event_type:
        controlStatus === "FAILED" ? "CONTROL_FAILED" : "CONTROL_SUCCEEDED",
      payload: {
        federated_digital_twin_id,
        federated_digital_object_id,
        federated_digital_object_control_data_id,
        digital_object_id,
        status: controlStatus,
        control_execution_time,
        control_execution_result,
      },
    });

    return { federated_digital_object_control_data_id };
  }

  async searchControl({
    federated_digital_twin_id,
    federated_digital_object_id,
    from,
    to,
    count,
  }) {
    if (!federated_digital_twin_id || !federated_digital_object_id) {
      throw new ErrorHandler(412, 5252, "please check mandatory field.");
    }

    const isExistID = await model.postgres.checkIdExist({
      table: "federated_digital_objects",
      check: "federated_digital_object_id",
      id: federated_digital_object_id,
    });
    if (!isExistID) {
      throw new ErrorHandler(412, 5252, "Unregistered digital_object");
    }

    /**
     * - t1: federated_controls 에서 commands 배열을 펼쳐서 (control_data_id, doid) 단위로 행 생성
     * - t2: federated_control_result 에서 (control_data_id, doid) 최신 1건만 선택
     * - d : digital_objects 에서 DO별 execution_timeout 조회
     * - delivery_meta: federated_controls.federated_digital_object_control_command JSON 내 delivery_meta_by_do 사용
     */
    let sql = `
    SELECT
      t1.federated_digital_object_control_data_id,
      t1.federated_digital_object_id,
      t1.digital_object_id,
      t1.federated_digital_object_control_creation_time,
      t1.federated_digital_object_control_delivery_time,
      t1.federated_digital_object_control_delivery_result,

      -- delivery_meta_by_do에서 DO별 status/error 추출
      (t1.federated_digital_object_control_command::jsonb -> 'delivery_meta_by_do' -> t1.digital_object_id ->> 'delivery_status') AS delivery_status,
      (t1.federated_digital_object_control_command::jsonb -> 'delivery_meta_by_do' -> t1.digital_object_id ->> 'delivery_error')  AS delivery_error,

      t2.federated_digital_object_control_execution_time,
      t2.federated_digital_object_control_execution_result,

      CASE
        WHEN t2.federated_digital_object_control_execution_result IS NOT NULL
             AND t2.federated_digital_object_control_execution_result <> 'null'
          THEN 'SUCCEEDED'
        WHEN NOW() >
             t1.federated_digital_object_control_creation_time
             + ((COALESCE(d.digital_object_control_execution_timeout, 60000)) || ' milliseconds')::interval
          THEN 'TIMEOUT'
        ELSE 'PENDING'
      END AS control_status
    FROM
      (
        SELECT
          c.federated_digital_object_control_data_id,
          c.federated_digital_object_control_creation_time,
          c.federated_digital_object_id,
          c.federated_digital_object_control_delivery_time,
          c.federated_digital_object_control_delivery_result,
          c.federated_digital_object_control_command,
          jsonb_array_elements(c.federated_digital_object_control_command::jsonb -> 'commands')::jsonb ->> 'digital_object_id' AS digital_object_id
        FROM federated_controls c
        WHERE c.federated_digital_object_id = '${federated_digital_object_id}'
      ) AS t1
    LEFT JOIN
      (
        SELECT DISTINCT ON (federated_digital_object_control_data_id, digital_object_id)
          federated_digital_object_control_data_id,
          federated_digital_object_id,
          digital_object_id,
          federated_digital_object_control_execution_time,
          federated_digital_object_control_execution_result
        FROM federated_control_result
        WHERE federated_digital_object_id = '${federated_digital_object_id}'
        ORDER BY
          federated_digital_object_control_data_id,
          digital_object_id,
          federated_digital_object_control_execution_time DESC
      ) AS t2
      ON t1.federated_digital_object_control_data_id = t2.federated_digital_object_control_data_id
     AND t1.digital_object_id = t2.digital_object_id
    LEFT JOIN digital_objects d
      ON d.digital_object_id = t1.digital_object_id
  `;

    // 기간 필터는 creation_time 기준
    if (from && to) {
      sql += ` WHERE t1.federated_digital_object_control_creation_time >= '${from}'::timestamp
             AND t1.federated_digital_object_control_creation_time <= '${to}'::timestamp`;
    } else if (from) {
      sql += ` WHERE t1.federated_digital_object_control_creation_time >= '${from}'::timestamp`;
    } else if (to) {
      sql += ` WHERE t1.federated_digital_object_control_creation_time <= '${to}'::timestamp`;
    }

    sql += ` ORDER BY t1.federated_digital_object_control_creation_time DESC;`;

    const retrievedData = await model.postgres.selectDataS({ sql });

    // === 기존 응답 구조 유지 + DO별 execution status + delivery status 추가 ===
    const returnData = {};
    let returnDataCount = 0;

    if (retrievedData.length !== 0) {
      for (const data of retrievedData) {
        const doID = data.digital_object_id;

        const doData = {
          // execution
          control_execution_time:
            data.federated_digital_object_control_execution_time,
          status: data.control_status,
          control_execution_result:
            data.federated_digital_object_control_execution_result,

          // delivery
          delivery_status: data.delivery_status || null,
          delivery_error: data.delivery_error || null,
        };

        const key = data.federated_digital_object_control_data_id;

        if (returnData[key]) {
          returnData[key]["federated_digital_object_control_execution_result"][
            doID
          ] = doData;
        } else {
          if (count && count <= returnDataCount) break;
          returnDataCount++;

          returnData[key] = {};
          returnData[key]["federated_digital_object_id"] =
            data.federated_digital_object_id;
          returnData[key]["federated_digital_object_control_creation_time"] =
            data.federated_digital_object_control_creation_time;
          returnData[key]["federated_digital_object_control_delivery_time"] =
            data.federated_digital_object_control_delivery_time;
          returnData[key]["federated_digital_object_control_delivery_result"] =
            data.federated_digital_object_control_delivery_result;

          returnData[key]["federated_digital_object_control_execution_result"] =
            {};
          returnData[key]["federated_digital_object_control_execution_result"][
            doID
          ] = doData;
        }
      }
    }

    return returnData;
  }
}

module.exports = FederatedDigitalObjects;
