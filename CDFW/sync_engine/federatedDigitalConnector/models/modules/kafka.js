const config = require("../../config");
const lib = require("../../lib");
const { connectHost } = config.kafka;
const [hostname, port] = connectHost.split(":");

class Kafka {
   /**
    * kafka와 통신하기 위한 options 설정
    * @param {String} method (required) post, get, put, delete 등 http request method
    * @param {String} path (required) host:port/ 뒤의 나머지 address
    * @returns {Json} {hostname, port, path, headers, maxRedirects, method, ...}
    */
   setOptions({ method, path }) {
      if (!method || !path) {
         throw ` > method || path undefined in kafka sink `;
      }

      return {
         method,
         hostname,
         port,
         path,
         headers: {
            "Content-Type": "application/json",
         },
         maxRedirects: 20,
      };
   }

   createTopics({ topic }) {
      producer.createTopics([topic], true, function (err, data) {
         if (err) logger.error(err);
         else logger.info(data);
      });
      return 0;
   }

   async GetConnectorCheck({ connectors }) {
      let getConnectors = await lib.request({
         method: "get",
         url: `http://${config.kafka.connectHost}/connectors`,
      });
      const data = new Set(getConnectors.data);
      for (let i = 0; i < connectors.length; i++) {
         if (!data.has(connectors[i])) {
            return false;
         }
      }
      return true;
   }

   kafkaProducer({ topic, kafkaKey, data }) {
      let payload = [
         {
            topic: topic,
            key: kafkaKey,
            messages: data, //sensor_data post body
         },
      ];
      logger.info("payload: ", payload);
      producer.send(payload, function (err, data) {
         if (err) logger.error(err);
         else logger.info(data);
      });
      return 0;
   }

   async deleteSink({ id }) {
      logger.info("Delete Sink Connector");
      await lib.request({
         method: "delete",
         url: `http://${config.kafka.connectHost}/connectors/${id}`,
         bodyParams: {},
      });
      return 0;
   }

   async createPostgresSinkConnector({ id }) {
      const sinkConnectorBody = {
         name: id,
         config: {
            "connector.class": "io.confluent.connect.jdbc.JdbcSinkConnector",
            "tasks.max": "1",
            topics: id,
            "input.data.format": "JSON",
            "connection.url": `jdbc:postgresql://${config.postgres.host}:${config.postgresPool.port}/${config.postgres.database}`,
            "connection.host": config.postgres.host,
            "connection.port": config.postgresPool.port,
            "connection.user": "postgres",
            "connection.password": config.postgres.password,
            "db.name": config.postgres.database,
            "auto.create": "true",
            "key.converter": "org.apache.kafka.connect.storage.StringConverter",
            "key.converter.schemas.enable": "false",
            "value.converter": "org.apache.kafka.connect.json.JsonConverter",
            "value.converter.schemas.enable": "false",
         },
      };

      await lib.request({
         url: `http://${config.kafka.connectHost}/connectors`,
         bodyParams: sinkConnectorBody,
      });
      return 0;
   }

   async createSourceOpenAPIConnector({
      id,
      url,
      time_interval,
      data_source_format,
      digital_twin_id,
      customized_data_source,
      additional_config,
   }) {
      let sinkConnectorBody = {
         name: "OpenAPI" + id,
         config: {
            "connector.class": customized_data_source,
            "tasks.max": "1",
            "kafka.topic": "Sensors",
            "api.url": url,
            "api.key": "source",
            "poll.interval.ms": time_interval,
            "digital.twin.id": digital_twin_id,
            "sensor.id": id,
            "request.method": "POST",
            headers:
               "Content-Type:application/json|Accept-Encoding: application/json",
            "key.converter": "org.apache.kafka.connect.storage.StringConverter",
            "value.converter":
               "org.apache.kafka.connect.storage.StringConverter",
            "data.source.format": data_source_format,
         },
      };

      if (additional_config) {
         for (let key in additional_config) {
            sinkConnectorBody.config.key = additional_config[key];
         }
      }

      await lib.request({
         url: `http://${config.kafka.connectHost}/connectors`,
         bodyParams: sinkConnectorBody,
      });
      return 0;
   }

   async createSourceMqttConnector({ id, url, digital_twin_id }) {
      const splitUrl = url.split("/");
      let sinkConnectorBody = {
         name: "MqttSource" + id,
         config: {
            "connector.class": "org.kafka.connect.mqtt.MqttSourceConnector",
            "mqtt.topic": splitUrl[3],
            "mqtt.client.id": id,
            "mqtt.broker.uri": `tcp://${splitUrl[2]}`,
            "kafka.topic": "Sensors",
            "sensor.id": id,
            "digital.twin.id": digital_twin_id,
            "key.converter": "org.apache.kafka.connect.storage.StringConverter",
            "key.converter.schemas.enable": false,
            "value.converter":
               "org.apache.kafka.connect.storage.StringConverter",
            "value.converter.schemas.enable": false,
         },
      };

      console.log(sinkConnectorBody);
      await lib.request({
         url: `http://${config.kafka.connectHost}/connectors`,
         bodyParams: sinkConnectorBody,
      });
      return 0;
   }
}

module.exports = Kafka;
