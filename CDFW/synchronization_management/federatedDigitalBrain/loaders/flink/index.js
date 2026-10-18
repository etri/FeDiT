const config = require("../../config");
const lib = require("../../lib");
const logger = require("../../lib/logger");
const Model = require("../../models");
const model = new Model();

/** Flink Start Reading Position
 * earliest-offset: start from the earliest offset possible.
 * latest-offset: start from the latest offset.
 * timestamp: start from user-supplied timestamp for each partition.
 */
const setTimezone = {
  statement: "SET 'table.local-time-zone' = 'UTC'",
};
const sedonaFlinkLib = config.flink.sedonaJarLocation;

exports.init = async () => {
  try {
    const windowArr = config.setWindowDOtable.term.filter((term) => term !== 0);
    const getSESSIONID = await lib.request({
      url: `http://${config.flink.gwOption.host}/v1/sessions`,
      bodyParams: {},
    });

    if (getSESSIONID?.data?.sessionHandle) {
      const SESSIONID = getSESSIONID.data.sessionHandle;
      console.log("[FLINK] SESSIONID: " + SESSIONID);
      await lib.request({
        url: `http://${config.flink.gwOption.host}/v1/sessions/${SESSIONID}/statements`,
        bodyParams: setTimezone,
      });

      let refreshMetadataTopics = [
        "UnalliedDigitalObjects",
        "FederatedDigitalObjects",
        "latestFederatedDigitalObjects",
        "FDOlatestSyncCompose",
      ];

      const sqlArr = [
        `CREATE TEMPORARY SYSTEM FUNCTION ST_Envelope as 'org.apache.sedona.flink.expressions.Functions$ST_Envelope' language java using jar '${sedonaFlinkLib}';`,
        `CREATE TEMPORARY SYSTEM FUNCTION ST_AsText as 'org.apache.sedona.flink.expressions.Functions$ST_AsText' language java using jar '${sedonaFlinkLib}';`,
        `CREATE TEMPORARY SYSTEM FUNCTION  ST_GeomFromText as 'org.apache.sedona.flink.expressions.Constructors$ST_GeomFromText' language java using jar '${sedonaFlinkLib}';`,
        `CREATE TEMPORARY SYSTEM FUNCTION ST_Contains as 'org.apache.sedona.flink.expressions.Predicates$ST_Contains' language java using jar '${sedonaFlinkLib}';`,
        `CREATE TABLE UnalliedDigitalObjects(digital_object_id STRING, digital_twin_id STRING, data STRING, rowtime TIMESTAMP(3), location STRING, WATERMARK FOR rowtime AS rowtime, proc_time AS PROCTIME()) WITH ('connector' = 'kafka', 'topic' = 'UnalliedDigitalObjects', 'properties.bootstrap.servers' = '${config.kafka.host}', 'properties.max.request.size' = '104857600','properties.max.partition.fetch.bytes' = '104857600', 'value.format' = 'json', 'value.json.ignore-parse-errors' = 'true', 'scan.startup.mode' = 'latest-offset');`,
        `CREATE TABLE FDOcomposition (compose_numeric_id INTEGER, federated_digital_twin_id STRING, federated_digital_object_id STRING, digital_object_id STRING, rowtime TIMESTAMP, PRIMARY KEY (compose_numeric_id) NOT ENFORCED) WITH ('connector' = 'jdbc', 'url' = 'jdbc:postgresql://${config.postgresPool.host}:${config.postgresPool.port}/${config.postgresPool.database}', 'table-name' = 'fdo_compositions', 'username' = '${config.postgresPool.user}', 'password' = '${config.postgresPool.password}','lookup.cache' = 'FULL');`,
        `CREATE TABLE FederatedDigitalObjects(federated_digital_object_id STRING, federated_digital_twin_id STRING, rowtime TIMESTAMP(3), data STRING, location STRING, WATERMARK FOR rowtime AS rowtime, PRIMARY KEY (federated_digital_object_id) NOT ENFORCED) WITH ('connector' = 'upsert-kafka', 'topic' = 'FederatedDigitalObjects', 'properties.bootstrap.servers' = '${config.kafka.host}', 'properties.max.request.size' = '104857600', 'properties.max.partition.fetch.bytes' = '104857600','key.format' = 'json', 'value.format' = 'json', 'value.json.ignore-parse-errors' = 'true');`,
        `CREATE TABLE FDOlatests (federated_digital_object_id STRING, federated_digital_twin_id STRING, rowtime TIMESTAMP(3), data STRING, location STRING, WATERMARK FOR rowtime AS rowtime, proc_time AS PROCTIME()) WITH ('connector' = 'kafka', 'topic' = 'latestFederatedDigitalObjects', 'properties.bootstrap.servers' = '${config.kafka.host}', 'properties.max.request.size' = '104857600', 'properties.max.partition.fetch.bytes' = '104857600', 'format' = 'json', 'scan.startup.mode' ='latest-offset');`,
        `CREATE TABLE FDOsyncCompositions (compose_id STRING, federated_digital_twin_id STRING, federated_digital_object_id STRING, time_sync INTEGER, spatial_sync STRING, rowtime TIMESTAMP, PRIMARY KEY (compose_id) NOT ENFORCED) WITH ('connector' = 'jdbc', 'url' = 'jdbc:postgresql://${config.postgresPool.host}:${config.postgresPool.port}/${config.postgresPool.database}', 'table-name' = 'fdo_sync_compositions', 'username' = '${config.postgresPool.user}', 'password' = '${config.postgresPool.password}');`,
        `CREATE TABLE FDOlatestSyncCompose(time_sync INTEGER, spatial_sync STRING, federated_digital_object_id STRING, data STRING, location STRING, federated_digital_twin_id STRING, rowtime TIMESTAMP(3), WATERMARK FOR rowtime AS rowtime, proc_time AS PROCTIME())WITH ('connector' = 'kafka', 'topic' = 'FDOlatestSyncCompose', 'properties.bootstrap.servers' = '${config.kafka.host}', 'properties.max.request.size' = '104857600', 'properties.max.partition.fetch.bytes' = '104857600', 'format' = 'json', 'scan.startup.mode' = 'latest-offset');`,
        `INSERT INTO FDOlatestSyncCompose SELECT time_sync, spatial_sync, FDOlatests.federated_digital_object_id, data, location, FDOlatests.federated_digital_twin_id, FDOlatests.rowtime FROM FDOlatests JOIN FDOsyncCompositions FOR SYSTEM_TIME AS OF FDOlatests.proc_time AS u ON FDOlatests.federated_digital_object_id = u.federated_digital_object_id;`,
      ];

      const insertSQLs = generateInsertSQLs(config.flink);
      sqlArr.push(...insertSQLs);

      let windowingSQL = [];
      for (let term of windowArr) {
        windowingSQL = [
          `CREATE TABLE FDOsyncWindows${term} (federated_digital_twin_id STRING, federated_digital_object_id STRING, rowtime TIMESTAMP(3), data STRING, location STRING, PRIMARY KEY (federated_digital_object_id) NOT ENFORCED) WITH ('connector' = 'upsert-kafka', 'topic' = 'FDOsyncWindows${term}', 'properties.bootstrap.servers' = '${config.kafka.host}', 'properties.max.request.size' = '104857600', 'properties.max.partition.fetch.bytes' = '104857600', 'key.format' = 'json', 'value.format' = 'json', 'value.json.ignore-parse-errors' = 'true');`,
          `INSERT INTO FDOsyncWindows${term} SELECT federated_digital_twin_id, federated_digital_object_id, window_start, last_value(data), LISTAGG(location) FROM TABLE(TUMBLE(TABLE FDOlatestSyncCompose, DESCRIPTOR(rowtime), INTERVAL '${term}' MINUTES)) where CASE WHEN spatial_sync = 'POLYGON EMPTY' THEN time_sync=${term} ELSE time_sync=${term} and ST_Contains(ST_GeomFromText(spatial_sync), ST_GeomFromText(location)) END group by federated_digital_twin_id, federated_digital_object_id, window_start;`,
        ];

        sqlArr.push(...windowingSQL);
        refreshMetadataTopics.push(`FDOsyncWindows${term}`);
      }

      try {
        await admin.createTopics({
          topics: refreshMetadataTopics.map((topic) => ({ topic })),
          waitForLeaders: true,
        });
      } catch (e) {
        console.warn(`Error ensuring kafka topics: ${e.message}`);
      }

      for (let i of sqlArr) {
        let StatementObj = {
          statement: i,
        };

        const res = await lib.request({
          url: `http://${config.flink.gwOption.host}/v1/sessions/${SESSIONID}/statements`,
          bodyParams: StatementObj,
        });

        console.log("[flink]\n", i, "\n", res.data);
      }

      const isExistLatestSink = await model.kafka.GetConnectorCheck({
        connectors: ["latestDataSink_FederatedDigitalObjects"],
      });

      if (!isExistLatestSink) {
        await model.kafka.createlatestDataSinkConnector({
          type: "FederatedDigitalObjects",
        });
      }

      const isExistFDOSink = await model.kafka.GetConnectorCheck({
        connectors: [`keyTopicDistSink_latestFederatedDigitalObjects`],
      });

      if (!isExistFDOSink) {
        await model.kafka.createKeyTopicDistributeSink({
          topic: "latestFederatedDigitalObjects",
          key: "federated_digital_object_id",
          type: "FDO_",
        });
      }

      const connectorNamesForFDOwindowsLatest = windowArr.map(
        (term) => `latestDataSink_FDOsyncWindows${term}`,
      );

      await model.kafka.checkAndCreateConnector(
        connectorNamesForFDOwindowsLatest,
        async (connectorName) => {
          const sinkConfig = {
            type: "FDOsyncWindows",
            term: connectorName.split("latestDataSink_FDOsyncWindows")[1],
          };

          await model.kafka.createlatestDataSinkConnector(sinkConfig);
        },
      );

      const connectorNamesForFDOwindowsDist = windowArr.map(
        (term) => `keyTopicDistSink_latestFDOsyncWindows${term}`,
      );

      await model.kafka.checkAndCreateConnector(
        connectorNamesForFDOwindowsDist,
        async (connectorName) => {
          const sinkConfig = {
            topic: connectorName.replace("keyTopicDistSink_", ""),
            key: "federated_digital_object_id",
            type: `FDO_window_${connectorName.replace(
              "keyTopicDistSink_latestFDOsyncWindows",
              "",
            )}_`,
          };

          await model.kafka.createKeyTopicDistributeSink(sinkConfig);
        },
      );

      const connectorNamesForFDOwindowsBase = windowArr.map(
        (term) => `DigitalBase_latestFDOsyncWindows${term}`,
      );

      await model.kafka.checkAndCreateConnector(
        connectorNamesForFDOwindowsBase,
        async (connectorName) => {
          const sinkConfig = {
            topic: connectorName.replace("DigitalBase_", ""),
            type: "federated_digital_object",
            table:
              `federated_digital_object_window_data_` +
              connectorName.replace("DigitalBase_latestFDOsyncWindows", ""),
          };

          await model.kafka.createPostgresSinkConnector(sinkConfig);
        },
      );
    } else {
      logger.error(
        "[FLINK] Failure to open sessions. FLINK SQL-GATEWAY must be executed to get the Flink Session.",
      );
    }
  } catch (error) {
    logger.error(`[FLINK] ${error}`);
  }
};

/**
 * DOcomposition 테이블의 전체 row 수(total_rows)를 기준으로
 * scan_partition_num 개수만큼 파티션을 나누어
 * 각 파티션 범위에 대해 하나의 Flink SQL INSERT Job을 생성한다.
 *
 * @param {number} scan_partition_num - 생성할 Job 수
 * @param {number} total_rows - DOcomposition 테이블의 전체 row 수
 * @param {string} mode - 파티션 나누기 방식 (default: "none")
 *   - "numeric": compose_numeric_id 기준으로 범위 나누기
 *   - "hash": federated_digital_object_id에서 문자열 해시값으로 파티션 나누기
 *   - "RoundRobin": federated_digital_object_id의 마지막 숫자만 추출하여 파티션 나누기
 *   - "none": 파티션 나누지 않고 전체 대상
 * @returns {string[]} Flink SQL INSERT 문 배열
 */
function generateInsertSQLs(config) {
  let { scan_partition_num, total_rows, mode } = config;
  console.log(
    `[FLINK] Partition mode: ${mode}, partition count: ${scan_partition_num}, total rows: ${total_rows}`,
  );

  const sqlArr = [];

  // 1. 파티션 수가 1 이하이면 무조건 none 모드
  if (scan_partition_num <= 1) mode = "none";

  // 2. numeric 모드에서 데이터가 적으면 none 모드로 변경
  if (
    mode === "numeric" &&
    (total_rows === 0 || total_rows < scan_partition_num)
  ) {
    mode = "none";
  }

  // insert SQL 템플릿 함수
  //UnalliedDigitalObjects.rowtime DESC
  function buildInsertSQL(condition = "") {
    return `INSERT INTO FederatedDigitalObjects 
WITH base AS (
  SELECT
    FDOcomposition.federated_digital_object_id,
    UnalliedDigitalObjects.digital_object_id,
    UnalliedDigitalObjects.data,
    FDOcomposition.federated_digital_twin_id,
    UnalliedDigitalObjects.rowtime,
    UnalliedDigitalObjects.location,
    ROW_NUMBER() OVER (
      PARTITION BY FDOcomposition.federated_digital_object_id, UnalliedDigitalObjects.digital_object_id
      ORDER BY UnalliedDigitalObjects.proc_time DESC
    ) AS numrow
  FROM UnalliedDigitalObjects
  JOIN FDOcomposition FOR SYSTEM_TIME AS OF UnalliedDigitalObjects.proc_time
    ON UnalliedDigitalObjects.digital_object_id = FDOcomposition.digital_object_id
    ${condition}
),
latest AS (
  SELECT
    federated_digital_object_id,
    digital_object_id,
    data,
    federated_digital_twin_id,
    rowtime,
    location
  FROM base
  WHERE numrow = 1
),
data_agg AS (
  SELECT
    federated_digital_object_id,
    federated_digital_twin_id,
    JSON_OBJECTAGG_NULL_ON_NULL(digital_object_id, data) AS data
  FROM latest
  GROUP BY federated_digital_object_id, federated_digital_twin_id
),
ts_agg AS (
  SELECT
    federated_digital_object_id,
    federated_digital_twin_id,
    MAX(rowtime) AS rowtime
  FROM latest
  GROUP BY federated_digital_object_id, federated_digital_twin_id
),
loc_agg AS (
  SELECT
    federated_digital_object_id,
    federated_digital_twin_id,
    ST_AsText(
      ST_Envelope(
        ST_GeomFromText(
          'GEOMETRYCOLLECTION (' ||
          REGEXP_REPLACE(
            LISTAGG(location, ','),
            'POINT EMPTY,|,POINT EMPTY',
            ''
          )
          || ')'
        )
      )
    ) AS location
  FROM latest
  GROUP BY federated_digital_object_id, federated_digital_twin_id
)
SELECT
  d.federated_digital_object_id,
  d.federated_digital_twin_id,
  t.rowtime,
  CAST(d.data AS STRING) AS data,
  l.location
FROM data_agg d
JOIN ts_agg t
  ON d.federated_digital_object_id = t.federated_digital_object_id
 AND d.federated_digital_twin_id  = t.federated_digital_twin_id
JOIN loc_agg l
  ON d.federated_digital_object_id = l.federated_digital_object_id
 AND d.federated_digital_twin_id  = l.federated_digital_twin_id;`;
  }

  if (mode === "none") {
    sqlArr.push(buildInsertSQL());
    return sqlArr;
  }

  // numeric 모드
  if (mode === "numeric") {
    const partition_size = Math.ceil(total_rows / scan_partition_num);
    for (let i = 0; i < scan_partition_num; i++) {
      const start = i * partition_size + 1;
      const end = Math.min((i + 1) * partition_size, total_rows);
      const condition = `AND FDOcomposition.compose_numeric_id BETWEEN ${start} AND ${end}`;
      sqlArr.push(buildInsertSQL(condition));
    }
    return sqlArr;
  }

  // hash, RoundRobin 모드 (partition_key 0 ~ scan_partition_num-1)
  if (mode === "hash" || mode === "RoundRobin") {
    for (
      let partition_key = 0;
      partition_key < scan_partition_num;
      partition_key++
    ) {
      let condition;
      if (mode === "hash") {
        // hash 방식: md5 앞 4자리의 ascii값 합을 사용한 파티셔닝
        condition = `
        AND MOD(
          ASCII(SUBSTRING(MD5(federated_digital_object_id), 1, 1)) +
          ASCII(SUBSTRING(MD5(federated_digital_object_id), 2, 1)) +
          ASCII(SUBSTRING(MD5(federated_digital_object_id), 3, 1)) +
          ASCII(SUBSTRING(MD5(federated_digital_object_id), 4, 1)),
          ${scan_partition_num}
        ) = ${partition_key}`;
      } else {
        // 마지막 전체 숫자
        condition = `AND MOD(CAST(REGEXP_EXTRACT(federated_digital_object_id, '(\\d+)$', 1) AS BIGINT), ${scan_partition_num}) = ${partition_key}`;
      }
      sqlArr.push(buildInsertSQL(condition));
    }
    return sqlArr;
  }

  // 예외: 지원되지 않는 모드
  throw new Error(`지원하지 않는 파티션 모드: ${mode}`);
}
