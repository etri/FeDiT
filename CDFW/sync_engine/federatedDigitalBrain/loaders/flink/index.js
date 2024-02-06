const config = require("../../config");
const lib = require("../../lib");
const logger = require("../../lib/logger");
const Model = require("../../models");
const model = new Model();

const setTimezone = {
   statement: "SET 'table.local-time-zone' = 'UTC'",
};
const sedonaFlinkLib = config.flink.sedonaJarLocation;
/** Flink Start Reading Position
 * earliest-offset: start from the earliest offset possible.
 * latest-offset: start from the latest offset.
 * timestamp: start from user-supplied timestamp for each partition.
 */
exports.init = async () => {
   try {
      const windowArr = config.setWindowDOtable.term.filter(
         (term) => term !== 0
      );
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
            `CREATE TABLE UnalliedDigitalObjects(digital_object_id STRING, digital_twin_id STRING, federated_digital_twin_id STRING, data STRING, rowtime TIMESTAMP(3), location STRING, WATERMARK FOR rowtime AS rowtime, proc_time AS PROCTIME()) WITH ('connector' = 'kafka', 'topic' = 'UnalliedDigitalObjects', 'properties.bootstrap.servers' = '${config.kafka.host}', 'properties.group.id' = 'UnalliedDigitalObjects_table', 'format' = 'json', 'scan.startup.mode' = 'latest-offset');`,
            `CREATE TABLE FDOcomposition (compose_id STRING, federated_digital_twin_id STRING, federated_digital_object_id STRING, digital_object_id STRING, rowtime TIMESTAMP, PRIMARY KEY (compose_id) NOT ENFORCED) WITH ('connector' = 'jdbc', 'url' = 'jdbc:postgresql://${config.postgresPool.host}:${config.postgresPool.port}/${config.postgresPool.database}', 'table-name' = 'fdo_compositions', 'username' = '${config.postgresPool.user}', 'password' = '${config.postgresPool.password}');`,
            `CREATE TABLE FederatedDigitalObjects(federated_digital_object_id STRING, federated_digital_twin_id STRING, rowtime TIMESTAMP(3), data STRING, location STRING, WATERMARK FOR rowtime AS rowtime, PRIMARY KEY (federated_digital_object_id) NOT ENFORCED) WITH ('connector' = 'upsert-kafka', 'topic' = 'FederatedDigitalObjects', 'properties.bootstrap.servers' = '${config.kafka.host}', 'key.format' = 'json', 'value.format' = 'json');`,
            `INSERT INTO FederatedDigitalObjects SELECT federated_digital_object_id, federated_digital_twin_id, MAX(rowtime) as rowtime, '{' || LISTAGG(CONCAT('"' || digital_object_id || '"', ':', data)) || '}' as data, ST_AsText(ST_Envelope(ST_GeomFromText('GEOMETRYCOLLECTION ('|| REGEXP_REPLACE(LISTAGG(location), 'POINT EMPTY,|,POINT EMPTY', '') || ')'))) as location FROM (SELECT federated_digital_object_id, digital_object_id, data, federated_digital_twin_id, location, rowtime, ROW_NUMBER() OVER (PARTITION BY federated_digital_object_id, digital_object_id ORDER BY rowtime DESC) AS numrow FROM (SELECT federated_digital_object_id, data, location, UnalliedDigitalObjects.digital_object_id, UnalliedDigitalObjects.federated_digital_twin_id, UnalliedDigitalObjects.rowtime FROM UnalliedDigitalObjects JOIN FDOcomposition FOR SYSTEM_TIME AS OF UnalliedDigitalObjects.proc_time AS u ON UnalliedDigitalObjects.digital_object_id = u.digital_object_id)) WHERE numrow = 1 GROUP BY federated_digital_object_id, federated_digital_twin_id;`,
            `CREATE TABLE FDOlatests (federated_digital_object_id STRING, federated_digital_twin_id STRING, rowtime TIMESTAMP(3), data STRING, location STRING, WATERMARK FOR rowtime AS rowtime, proc_time AS PROCTIME()) WITH ('connector' = 'kafka', 'topic' = 'latestFederatedDigitalObjects', 'properties.bootstrap.servers' = '${config.kafka.host}', 'properties.group.id' = 'latestFederatedDigitalObjects', 'format' = 'json', 'scan.startup.mode' ='latest-offset');`,
            `CREATE TABLE FDOsyncCompositions (compose_id STRING, federated_digital_twin_id STRING, federated_digital_object_id STRING, time_sync INTEGER, spatial_sync STRING, rowtime TIMESTAMP, PRIMARY KEY (compose_id) NOT ENFORCED) WITH ('connector' = 'jdbc', 'url' = 'jdbc:postgresql://${config.postgresPool.host}:${config.postgresPool.port}/${config.postgresPool.database}', 'table-name' = 'fdo_sync_compositions', 'username' = '${config.postgresPool.user}', 'password' = '${config.postgresPool.password}');`,
            `CREATE TABLE FDOlatestSyncCompose(time_sync INTEGER, spatial_sync STRING, federated_digital_object_id STRING, data STRING, location STRING, federated_digital_twin_id STRING, rowtime TIMESTAMP(3), WATERMARK FOR rowtime AS rowtime, proc_time AS PROCTIME())WITH ('connector' = 'kafka', 'topic' = 'FDOlatestSyncCompose', 'properties.bootstrap.servers' = '${config.kafka.host}', 'properties.group.id' = 'FDOlatestSyncCompose_table', 'format' = 'json', 'scan.startup.mode' = 'latest-offset');`,
            `INSERT INTO FDOlatestSyncCompose SELECT time_sync, spatial_sync, FDOlatests.federated_digital_object_id, data, location, FDOlatests.federated_digital_twin_id, FDOlatests.rowtime FROM FDOlatests JOIN FDOsyncCompositions FOR SYSTEM_TIME AS OF FDOlatests.proc_time AS u ON FDOlatests.federated_digital_object_id = u.federated_digital_object_id;`,
         ];

         let windowingSQL = [];
         for (let term of windowArr) {
            windowingSQL = [
               `CREATE TABLE FDOsyncWindows${term} (federated_digital_twin_id STRING, federated_digital_object_id STRING, rowtime TIMESTAMP(3), data STRING, location STRING, PRIMARY KEY (federated_digital_object_id) NOT ENFORCED) WITH ('connector' = 'upsert-kafka', 'topic' = 'FDOsyncWindows${term}', 'properties.bootstrap.servers' = '${config.kafka.host}', 'key.format' = 'json', 'value.format' = 'json');`,
               `INSERT INTO FDOsyncWindows${term} SELECT federated_digital_twin_id, federated_digital_object_id, window_start, last_value(data), LISTAGG(location) FROM TABLE(TUMBLE(TABLE FDOlatestSyncCompose, DESCRIPTOR(rowtime), INTERVAL '${term}' MINUTES)) where CASE WHEN spatial_sync = 'POLYGON EMPTY' THEN time_sync=${term} ELSE time_sync=${term} and ST_Contains(ST_GeomFromText(spatial_sync), ST_GeomFromText(location)) END group by federated_digital_twin_id, federated_digital_object_id, window_start;`,
            ];

            sqlArr.push(...windowingSQL);
            refreshMetadataTopics.push(`FDOsyncWindows${term}`);
         }

         client.refreshMetadata(refreshMetadataTopics, (err) => {
            if (err) {
               console.warn("Error refreshing kafka metadata", err);
            }
         });

         console.log(sqlArr);
         for (let i of sqlArr) {
            let StatementObj = {
               statement: i,
            };

            const res = await lib.request({
               url: `http://${config.flink.gwOption.host}/v1/sessions/${SESSIONID}/statements`,
               bodyParams: StatementObj,
            });

            console.log("[flink] ", i, "\n", res.data);
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
            (term) => `latestDataSink_FDOsyncWindows${term}`
         );

         await model.kafka.checkAndCreateConnector(
            connectorNamesForFDOwindowsLatest,
            async (connectorName) => {
               const sinkConfig = {
                  type: "FDOsyncWindows",
                  term: connectorName.split("latestDataSink_FDOsyncWindows")[1],
               };

               await model.kafka.createlatestDataSinkConnector(sinkConfig);
            }
         );

         const connectorNamesForFDOwindowsDist = windowArr.map(
            (term) => `keyTopicDistSink_latestFDOsyncWindows${term}`
         );

         await model.kafka.checkAndCreateConnector(
            connectorNamesForFDOwindowsDist,
            async (connectorName) => {
               const sinkConfig = {
                  topic: connectorName.replace("keyTopicDistSink_", ""),
                  key: "federated_digital_object_id",
                  type: `FDO_window_${connectorName.replace(
                     "keyTopicDistSink_latestFDOsyncWindows",
                     ""
                  )}_`,
               };

               await model.kafka.createKeyTopicDistributeSink(sinkConfig);
            }
         );

         const connectorNamesForFDOwindowsBase = windowArr.map(
            (term) => `DigitalBase_latestFDOsyncWindows${term}`
         );

         await model.kafka.checkAndCreateConnector(
            connectorNamesForFDOwindowsBase,
            async (connectorName) => {
               const sinkConfig = {
                  topic: connectorName.replace("DigitalBase_", ""),
                  type: "federated_digital_object",
                  table:
                     `federated_digital_object_window_data_` +
                     connectorName.replace(
                        "DigitalBase_latestFDOsyncWindows",
                        ""
                     ),
               };

               await model.kafka.createPostgresSinkConnector(sinkConfig);
            }
         );
      } else {
         logger.error(
            "[FLINK] Failure to open sessions. FLINK SQL-GATEWAY must be executed to get the Flink Session."
         );
      }
   } catch (error) {
      logger.error(`[FLINK] ${error}`);
   }
};
