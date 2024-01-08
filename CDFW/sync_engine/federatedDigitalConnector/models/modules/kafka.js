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
      producer.send(payload, function (err, data) {
         if (err) logger.error(err);
         else logger.info(data);
      });
      return 0;
   }

   async deleteSink({ id }) {
      logger.info(`Delete Sink Connector ${id}`);
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

   async createSourceHttpConnector({
      id,
      url,
      digital_twin_id,
      federated_digital_twin_id,
      digital_object_data_interval,
   }) {
      let sourceConnectorBody = {
         name: "HttpSource" + id,
         config: {
            "connector.class":
               "org.kafka.connect.http.HttpSourceOptionalConnector",
            "kafka.topic": "UnalliedDigitalObjects",
            "api.url": url,
            "poll.interval.ms": digital_object_data_interval,
            "digital.twin.id": digital_twin_id,
            "federated.digital.twin.id": federated_digital_twin_id,
            "digital.object.id": id,
            "request.method": "POST",
            headers:
               "Content-Type:application/json|Accept-Encoding: application/json",
            "key.converter": "org.apache.kafka.connect.storage.StringConverter",
            "value.converter":
               "org.apache.kafka.connect.storage.StringConverter",
            "data.source.format": "json",
         },
      };
      await lib.request({
         url: `http://${config.kafka.connectHost}/connectors`,
         bodyParams: sourceConnectorBody,
      });
      return 0;
   }

   async createSourceMqttConnector({
      id,
      url,
      digital_twin_id,
      federated_digital_twin_id,
   }) {
      let mqttBrokerUri = url.split("//")[1].split("/")[0];
      let mqttTopic = url.split("//")[1].split("/").slice(1).join("/");
      let sourceConnectorBody = {
         name: "MqttSource" + id,
         config: {
            "connector.class": "org.kafka.connect.mqtt.MqttSourceConnector",
            "mqtt.topic": mqttTopic,
            "mqtt.client.id": id,
            "mqtt.broker.uri": `tcp://${mqttBrokerUri}`,
            "kafka.topic": "UnalliedDigitalObjects",
            "digital.twin.id": digital_twin_id,
            "federated.digital.twin.id": federated_digital_twin_id,
            "digital.object.id": id,
            "key.converter": "org.apache.kafka.connect.storage.StringConverter",
            "key.converter.schemas.enable": false,
            "value.converter":
               "org.apache.kafka.connect.storage.StringConverter",
            "value.converter.schemas.enable": false,
         },
      };
      await lib.request({
         url: `http://${config.kafka.connectHost}/connectors`,
         bodyParams: sourceConnectorBody,
      });
      return 0;
   }
}

module.exports = Kafka;
