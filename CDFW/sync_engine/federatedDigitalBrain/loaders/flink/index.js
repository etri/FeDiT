const config = require("../../config");
const lib = require("../../lib");
const Model = require("../../models");
const model = new Model();

global.SESSIONID = null;
const setTimezone = {
   statement: "SET 'table.local-time-zone' = 'UTC'",
};

/** Flink Start Reading Position
 * earliest-offset: start from the earliest offset possible.
 * latest-offset: start from the latest offset.
 * timestamp: start from user-supplied timestamp for each partition.
 */
exports.init = async () => {
   const getSESSIONID = await lib.request({
      url: `http://${config.flink.gwOption.host}/v1/sessions`,
      bodyParams: {},
   });

   const SESSIONID = getSESSIONID.data.sessionHandle;
   console.log("[FLINK] SESSIONID: " + SESSIONID);
   await lib.request({
      url: `http://${config.flink.gwOption.host}/v1/sessions/${SESSIONID}/statements`,
      bodyParams: setTimezone,
   });

   //For BrokerNotAvailableError: Could not find the leader
   client.refreshMetadata(
      [
         "UnalliedDigitalObject",
         "FederatedDigitalObjects",
         "latestUnalliedDigitalObject",
         "latestFederatedDigitalObjects",
      ],
      //UnalliedDigitalObject topic명은 현 미러레이크의 DigitalObjects와 겹쳐서 임시로 이렇게 지었음!
      (err) => {
         if (err) {
            console.warn("Error refreshing kafka metadata", err);
         }
      }
   );

   const status = await model.kafka.GetConnectorCheck({
      connectors: [
         "latestDataSink_FederatedDigitalObjects",
         "latestDataSink_UnalliedDigitalObject",
      ],
   });

   if (status) {
      console.log("Default connectors already exist");
   } else {
      await model.kafka.createlatestDataSinkConnector({
         type: "FederatedDigitalObjects",
      });
      await model.kafka.createlatestDataSinkConnector({
         type: "UnalliedDigitalObject",
      });
   }

   // 'scan.startup.mode' = timestamp
   // const millisTimeStamp = Date.now();
   // 'scan.startup.timestamp-millis'=${millisTimeStamp}
   // `CREATE TABLE DO_latests(digital_object_data_id STRING, digital_object_id STRING, digital_twin_id STRING, rowtime TIMESTAMP(3), data STRING, location STRING, WATERMARK FOR rowtime AS rowtime) WITH ( 'connector' = 'kafka', 'topic' = 'latestDigitalObjects', 'properties.bootstrap.servers' = '${config.kafka.host}', 'properties.group.id' = 'DO_latest', 'format' = 'json', 'scan.startup.mode' ='latest-offset');`,
   // `CREATE TABLE DO_windows(digital_object_id STRING, window_start TIMESTAMP(3), window_end TIMESTAMP(3), data STRING, PRIMARY KEY (digital_object_id) NOT ENFORCED) WITH ('connector' = 'upsert-kafka', 'topic' = 'DO_windows', 'properties.bootstrap.servers' = '${config.kafka.host}', 'key.format' = 'json', 'value.format' = 'json');`,
   // `INSERT INTO DO_windows SELECT digital_object_id, window_start, window_end, last_value(data) FROM TABLE(TUMBLE(TABLE DO_latests, DESCRIPTOR(rowtime), INTERVAL '5' MINUTES)) group by digital_object_id, window_start, window_end;`,
   const sqlArr = [
      `CREATE TABLE UnalliedDigitalObject(digital_object_id STRING, digital_twin_id STRING, federated_digital_twin_id STRING, data STRING, rowtime TIMESTAMP(3), location STRING, WATERMARK FOR rowtime AS rowtime, proc_time AS PROCTIME()) WITH ('connector' = 'kafka', 'topic' = 'UnalliedDigitalObject', 'properties.bootstrap.servers' = '${config.kafka.host}', 'properties.group.id' = 'UnalliedDigitalObject_table', 'format' = 'json', 'scan.startup.mode' = 'latest-offset');`,
      `CREATE TABLE FDOcomposition (compose_id STRING, federated_digital_twin_id STRING, federated_digital_object_id STRING, digital_object_id STRING, rowtime TIMESTAMP, PRIMARY KEY (compose_id) NOT ENFORCED) WITH ('connector' = 'jdbc', 'url' = 'jdbc:postgresql://${config.postgresPool.host}:${config.postgresPool.port}/${config.postgresPool.database}', 'table-name' = 'fdo_compositions', 'username' = '${config.postgresPool.user}', 'password' = '${config.postgresPool.password}');`,
      `CREATE TABLE FederatedDigitalObject(federated_digital_object_data_id STRING, federated_digital_object_id STRING, federated_digital_twin_id STRING, rowtime TIMESTAMP(3), data STRING, location STRING, WATERMARK FOR rowtime AS rowtime, PRIMARY KEY (federated_digital_object_id) NOT ENFORCED) WITH ('connector' = 'upsert-kafka', 'topic' = 'FederatedDigitalObject', 'properties.bootstrap.servers' = '${config.kafka.host}', 'key.format' = 'json', 'value.format' = 'json');`,
      `INSERT INTO FederatedDigitalObject SELECT uuid(), federated_digital_object_id, federated_digital_twin_id, MAX(rowtime) as rowtime, '{' || LISTAGG(CONCAT('"' || digital_object_id || '"', ':', data)) || '}' as data, '{' || LISTAGG(CONCAT('"' || sensor_id || '"', ':', location)) || '}' as location FROM (SELECT federated_digital_object_id, digital_object_id, data, federated_digital_twin_id, location, rowtime, ROW_NUMBER() OVER (PARTITION BY federated_digital_object_id, digital_object_id ORDER BY rowtime DESC) AS numrow FROM (SELECT federated_digital_object_id, data, location, UnalliedDigitalObject.digital_object_id, UnalliedDigitalObject.federated_digital_twin_id, UnalliedDigitalObject.rowtime FROM UnalliedDigitalObject JOIN FDOcomposition FOR SYSTEM_TIME AS OF UnalliedDigitalObject.proc_time AS u ON UnalliedDigitalObject.digital_object_id = u.digital_object_id))WHERE numrow = 1 GROUP BY federated_digital_object_id, federated_digital_twin_id, location;`,
   ];

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
};
