const config = require("../../config");
const lib = require("../../lib");
const logger = require("../../lib/logger");
const Model = require("../../models");
const model = new Model();

const setTimezone = {
   statement: "SET 'table.local-time-zone' = 'UTC'",
};
const sedonaFlinkLib = config.setSedonaFlinkFunc.jarLocation;
/** Flink Start Reading Position
 * earliest-offset: start from the earliest offset possible.
 * latest-offset: start from the latest offset.
 * timestamp: start from user-supplied timestamp for each partition.
 */
exports.init = async () => {
   let getSESSIONID = null;
   try {
      getSESSIONID = await lib.request({
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

         const status = await model.kafka.GetConnectorCheck({
            connectors: ["latestDataSink_FederatedDigitalObjects"],
         });

         if (!status) {
            await model.kafka.createlatestDataSinkConnector({
               type: "FederatedDigitalObjects",
            });
         }

         const sqlArr = [
            `CREATE TEMPORARY SYSTEM FUNCTION ST_AsText as 'org.apache.sedona.flink.expressions.Functions$ST_AsText' language java using jar '${sedonaFlinkLib}';`,
            `CREATE TEMPORARY SYSTEM FUNCTION ST_Envelope_Aggr as 'org.apache.sedona.flink.expressions.Aggregators$ST_Envelope_Aggr' language java using jar '${sedonaFlinkLib}';`,
            `CREATE TEMPORARY SYSTEM FUNCTION  ST_GeomFromText as 'org.apache.sedona.flink.expressions.Constructors$ST_GeomFromText' language java using jar '${sedonaFlinkLib}';`,
            `CREATE TEMPORARY SYSTEM FUNCTION ST_Contains as 'org.apache.sedona.flink.expressions.Predicates$ST_Contains' language java using jar '${sedonaFlinkLib}';`,
            `CREATE TABLE UnalliedDigitalObjects(digital_object_id STRING, digital_twin_id STRING, federated_digital_twin_id STRING, data STRING, rowtime TIMESTAMP(3), location STRING, WATERMARK FOR rowtime AS rowtime, proc_time AS PROCTIME()) WITH ('connector' = 'kafka', 'topic' = 'UnalliedDigitalObjects', 'properties.bootstrap.servers' = '${config.kafka.host}', 'properties.group.id' = 'UnalliedDigitalObjects_table', 'format' = 'json', 'scan.startup.mode' = 'latest-offset');            `,
            `CREATE TABLE FDOcomposition (compose_id STRING, federated_digital_twin_id STRING, federated_digital_object_id STRING, digital_object_id STRING, digital_object_count INTEGER, rowtime TIMESTAMP, PRIMARY KEY (compose_id) NOT ENFORCED) WITH ('connector' = 'jdbc', 'url' = 'jdbc:postgresql://${config.postgresPool.host}:${config.postgresPool.port}/${config.postgresPool.database}', 'table-name' = 'fdo_compositions', 'username' = '${config.postgresPool.user}', 'password' = '${config.postgresPool.password}');`,
            `CREATE TABLE FederatedDigitalObjects(federated_digital_object_data_id STRING, federated_digital_object_id STRING, federated_digital_twin_id STRING, rowtime TIMESTAMP(3), data STRING, location STRING, WATERMARK FOR rowtime AS rowtime, PRIMARY KEY (federated_digital_object_id) NOT ENFORCED) WITH ('connector' = 'upsert-kafka', 'topic' = 'FederatedDigitalObjects', 'properties.bootstrap.servers' = '${config.kafka.host}', 'key.format' = 'json', 'value.format' = 'json');`,
            `INSERT INTO FederatedDigitalObjects SELECT uuid(), federated_digital_object_id, federated_digital_twin_id, MAX(rowtime) as rowtime, '{' || LISTAGG(CONCAT('"' || digital_object_id || '"', ':', data)) || '}' as data, CASE WHEN digital_object_count > 1 THEN ST_AsText(ST_Envelope_Aggr(ST_GeomFromText(location))) WHEN digital_object_count = 1 THEN ST_AsText(ST_GeomFromText(LISTAGG(location))) ELSE ST_AsText(ST_GeomFromText('POLYGON EMPTY')) END as location FROM (SELECT federated_digital_object_id, digital_object_id, data, federated_digital_twin_id, location, rowtime, digital_object_count,ROW_NUMBER() OVER (PARTITION BY federated_digital_object_id, digital_object_id ORDER BY rowtime DESC) AS numrow FROM (SELECT digital_object_count, federated_digital_object_id, data, location, UnalliedDigitalObjects.digital_object_id, UnalliedDigitalObjects.federated_digital_twin_id, UnalliedDigitalObjects.rowtime FROM UnalliedDigitalObjects JOIN FDOcomposition FOR SYSTEM_TIME AS OF UnalliedDigitalObjects.proc_time AS u ON UnalliedDigitalObjects.digital_object_id = u.digital_object_id)) WHERE numrow = 1 GROUP BY federated_digital_object_id, federated_digital_twin_id, digital_object_count;`,
            `CREATE TABLE FDOlatests (federated_digital_object_data_id STRING, federated_digital_object_id STRING, federated_digital_twin_id STRING, rowtime TIMESTAMP(3), data STRING, location STRING, WATERMARK FOR rowtime AS rowtime, proc_time AS PROCTIME()) WITH ('connector' = 'kafka', 'topic' = 'latestFederatedDigitalObjects', 'properties.bootstrap.servers' = '${config.kafka.host}', 'properties.group.id' = 'latestFederatedDigitalObjects', 'format' = 'json', 'scan.startup.mode' ='latest-offset');`,
            `CREATE TABLE FDOsyncCompositions (compose_id STRING, federated_digital_twin_id STRING, federated_digital_object_id STRING, time_sync INTEGER, spatial_sync STRING, rowtime TIMESTAMP, PRIMARY KEY (compose_id) NOT ENFORCED) WITH ('connector' = 'jdbc', 'url' = 'jdbc:postgresql://${config.postgresPool.host}:${config.postgresPool.port}/${config.postgresPool.database}', 'table-name' = 'fdo_sync_compositions', 'username' = '${config.postgresPool.user}', 'password' = '${config.postgresPool.password}');`,
            `CREATE TABLE FDOlatestSyncCompose(time_sync INTEGER, spatial_sync STRING, federated_digital_object_id STRING, data STRING, location STRING, federated_digital_twin_id STRING, rowtime TIMESTAMP(3), WATERMARK FOR rowtime AS rowtime, proc_time AS PROCTIME())WITH ('connector' = 'kafka', 'topic' = 'FDOlatestSyncCompose', 'properties.bootstrap.servers' = '${config.kafka.host}', 'properties.group.id' = 'FDOlatestSyncCompose_table', 'format' = 'json', 'scan.startup.mode' = 'latest-offset');`,
            `INSERT INTO FDOlatestSyncCompose SELECT time_sync, spatial_sync, FDOlatests.federated_digital_object_id, data, location, FDOlatests.federated_digital_twin_id, FDOlatests.rowtime FROM FDOlatests JOIN FDOsyncCompositions FOR SYSTEM_TIME AS OF FDOlatests.proc_time AS u ON FDOlatests.federated_digital_object_id = u.federated_digital_object_id;`,
         ];

         const windowArr = config.setWindowDOtable.term;
         let windowingSQL = [];
         for (let term of windowArr) {
            if (term !== 0) {
               windowingSQL = [
                  `CREATE TABLE FDOsyncWindows${term} (federated_digital_object_id STRING, window_start TIMESTAMP(3), window_end TIMESTAMP(3), data STRING, time_sync INTEGER, spatial_sync STRING, location STRING, PRIMARY KEY (federated_digital_object_id, window_start, window_end) NOT ENFORCED) WITH ('connector' = 'upsert-kafka', 'topic' = 'FDOsyncWindows${term}', 'properties.bootstrap.servers' = '${config.kafka.host}', 'key.format' = 'json', 'value.format' = 'json');`,
                  `INSERT INTO FDOsyncWindows${term} SELECT federated_digital_object_id, window_start, window_end, last_value(data), time_sync, spatial_sync, location FROM TABLE(TUMBLE(TABLE FDOlatestSyncCompose, DESCRIPTOR(rowtime), INTERVAL '${term}' MINUTES)) where CASE WHEN spatial_sync = 'POLYGON EMPTY' THEN time_sync=${term} ELSE time_sync=${term} and ST_Contains(ST_GeomFromText(spatial_sync), ST_GeomFromText(location)) END group by federated_digital_object_id, window_start, window_end, spatial_sync, location, time_sync;`,
               ];

               sqlArr.push(...windowingSQL);
               // Add topic for client.refreshMetadata
               refreshMetadataTopics.push(`FDOsyncWindows${term}`);
            }
         }

         client.refreshMetadata(refreshMetadataTopics, (err) => {
            if (err) {
               console.warn("Error refreshing kafka metadata", err);
            }
         });

         console.log(sqlArr);
         // for (let i of sqlArr) {
         //    let StatementObj = {
         //       statement: i,
         //    };

         //    const res = await lib.request({
         //       url: `http://${config.flink.gwOption.host}/v1/sessions/${SESSIONID}/statements`,
         //       bodyParams: StatementObj,
         //    });

         //    console.log("[flink] ", i, "\n", res.data);
         // }
      } else {
         logger.error(
            "[FLINK] Failure to open sessions. FLINK SQL-GATEWAY must be executed to get the Flink Session."
         );
      }
   } catch (error) {
      logger.error(`[FLINK] ${error}`);
   }
};
