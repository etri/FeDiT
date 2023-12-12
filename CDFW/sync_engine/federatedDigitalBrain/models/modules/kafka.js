const config = require("../../config");
const lib = require("../../lib");
const { connectHost } = config.kafka;
const [hostname, port] = connectHost.split(":");

const http = require("http");

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

   /**
    *
    * @param {String} type (DigitalObjects, Sensors)
    * @returns
    */
   async createlatestDataSinkConnector({ type }) {
      let field;
      if (type == "UnalliedDigitalObject") {
         field = "@.digital_object_id";
      } else if (type == "FederatedDigitalObjects") {
         field = "@.federated_digital_object_id";
      }
      const bodyConfig = {
         name: "latestDataSink_" + type,
         config: {
            "connector.class": "com.keti.connector.kafka.KafkaSinkConnector",
            "key.converter": "org.apache.kafka.connect.storage.StringConverter",
            "value.converter":
               "org.apache.kafka.connect.storage.StringConverter",
            "kafka.sink.bootstrap": config.kafka.host,
            "kafka.sink.topic": "latest" + type,
            "tasks.max": "1",
            topics: type,
            "kafka.key.enabled": "true",
            "kafka.key.field": field,
         },
      };
      await lib.request({
         method: "post",
         url: `http://${config.kafka.connectHost}/connectors`,
         bodyParams: bodyConfig,
      });
      return 0;
   }

   /**
    * {
  name: 'Sink',
  config: {
    'connector.class': 'org.kafka.connect.http.HttpSinkSubscriptionConnector',
    'tasks.max': '1',
    'http.api.url': 'http://localhost:1234/receiver,http://localhost:1235/receiver',
    topics: 'D21,D20',//simulation_subject
    'digital.twin.id': 'D46d8c5717a08988190a816a71edff08e',
    'subscription.id': 'S47cd94f6338a2890bc1a1bf3bb69357a',
    'subscription.name': 'tsub1',
    'request.method': 'POST',
    headers: 'Content-Type:application/json|Accept-Encoding: application/json',
    'key.converter': 'org.apache.kafka.connect.storage.StringConverter',
    'value.converter': 'org.apache.kafka.connect.storage.StringConverter'
  }
}
    * @param {*} param0 
    */
   async createSimulationSinkConnector({
      digital_twin_id,
      simulation_id,
      simulation_name,
      simulation_subject,
      simulation_access_url,
      simulation_attribute,
      time_step,
      resource_type,
      include_input,
   }) {
      const ConnectorBody = {
         name: `SIM${simulation_id}`,
         config: {
            "connector.class":
               "org.kafka.connect.http.HttpSinkSimulationSlideStepConnector",
            "tasks.max": "1",
            "request.method": "POST",
            headers:
               "Content-Type:application/json|Accept-Encoding: application/json",
            "key.converter": "org.apache.kafka.connect.storage.StringConverter",
            "value.converter":
               "org.apache.kafka.connect.storage.StringConverter",
            "response.topic": `${simulation_id}_result`,
            "time.step": time_step,
            "kafka.api.url": config.kafka.host,
            "http.api.url": simulation_access_url,
            topics: "latestDigitalObjects",
            digital_twin_id,
            "simulation.id": simulation_id,
            "simulation.name": simulation_name,
            "resource.type": resource_type,
            "include.input": include_input,
            "key.field": "digital_object_id",
            "key.topic": simulation_subject,
            "postgres.password": config.postgresPool.password,
            "postgres.url": `jdbc:postgresql://${config.postgresPool.host}:${config.postgresPool.port}/mirrorlake`,
            "postgres.user": config.postgresPool.user,
         },
      };

      if (simulation_attribute) {
         ConnectorBody.config["simulation.attribute"] = simulation_attribute;
      } else {
         ConnectorBody.config["simulation.attribute"] = "";
      }

      await lib.request({
         method: "post",
         url: `http://${config.kafka.connectHost}/connectors`,
         bodyParams: ConnectorBody,
      });

      return 0;
   }

   async updateSimulationSinkConnector({
      digital_twin_id,
      simulation_id,
      simulation_name,
      simulation_subject,
      simulation_access_url,
      simulation_attribute,
      time_step,
      resource_type,
      include_input,
   }) {
      const ConnectorBody = {
         "connector.class":
            "org.kafka.connect.http.HttpSinkSimulationSlideStepConnector",
         "tasks.max": "1",
         "request.method": "POST",
         headers:
            "Content-Type:application/json|Accept-Encoding: application/json",
         "key.converter": "org.apache.kafka.connect.storage.StringConverter",
         "value.converter": "org.apache.kafka.connect.storage.StringConverter",
         "response.topic": `${simulation_id}_result`,
         "time.step": time_step,
         "kafka.api.url": config.kafka.host,
         "http.api.url": simulation_access_url,
         topics: "latestDigitalObjects",
         digital_twin_id,
         "simulation.id": simulation_id,
         "simulation.name": simulation_name,
         "resource.type": resource_type,
         "include.input": include_input,
         "key.field": "digital_object_id",
         "key.topic": simulation_subject,
         "postgres.password": config.postgresPool.password,
         "postgres.url": `jdbc:postgresql://${config.postgresPool.host}:${config.postgresPool.port}/mirrorlake`,
         "postgres.user": config.postgresPool.user,
      };

      if (!simulation_attribute) {
         ConnectorBody["simulation.attribute"] = "";
      }

      await lib.request({
         method: "put",
         url: `http://${config.kafka.connectHost}/connectors/SIM${simulation_id}/config`,
         bodyParams: ConnectorBody,
      });

      return 0;
   }

   async createSubscriptionSinkConnector({
      digital_twin_id,
      subscription_id,
      subscription_name,
      notification_url,
      topics,
      topicArr,
      subscription_protocol,
   }) {
      let hasDTopic = false; // "D"로 시작하는 요소가 있는지 여부를 추적하기 위한 변수
      let topicList = ""; // 최종 결과를 저장할 변수
      for (let i = 0; i < topicArr.length; i++) {
         if (topicArr[i].startsWith("D")) {
            if (!hasDTopic) {
               if (topicList !== "") {
                  topicList += ",";
               }
               topicList += "latestDigitalObjects"; // "D"로 시작하는 요소가 처음 발견된 경우
               hasDTopic = true;
            }
         } else {
            if (topicList !== "") {
               topicList += ",";
            }
            topicList += topicArr[i]; // "D"로 시작하지 않는 요소일 경우
         }
      }

      if (subscription_protocol === "http") {
         const ConnectorBody = {
            name: `SUB${subscription_id}`,
            config: {
               "connector.class":
                  "org.kafka.connect.http.HttpSinkSubscriptionKeyFieldConnector",
               "tasks.max": "1",
               "http.api.url": notification_url,
               topics: topicList,
               "digital.twin.id": digital_twin_id,
               "subscription.id": subscription_id,
               "subscription.name": subscription_name,
               "request.method": "POST",
               headers:
                  "Content-Type:application/json|Accept-Encoding: application/json",
               "key.converter":
                  "org.apache.kafka.connect.storage.StringConverter",
               "value.converter":
                  "org.apache.kafka.connect.storage.StringConverter",
               "key.topic": lib.arryToString(topics),
            },
         };

         await lib.request({
            method: "post",
            url: `http://${config.kafka.connectHost}/connectors`,
            bodyParams: ConnectorBody,
         });
         return 0;
      } else if (subscription_protocol === "mqtt") {
         let splitURLsink = notification_url.split("/");
         const ConnectorBody = {
            name: `SUB${subscription_id}`,
            config: {
               "connector.class":
                  "org.kafka.connect.mqtt.MqttSubscriptionKeyFieldSinkConnector",
               topics: topicList,
               "mqtt.topic": splitURLsink[3],
               "mqtt.client.id": subscription_id,
               "mqtt.broker.uri": `tcp://${splitURLsink[2]}`,
               "key.converter":
                  "org.apache.kafka.connect.storage.StringConverter",
               "value.converter":
                  "org.apache.kafka.connect.storage.StringConverter",
               "key.topic": lib.arryToString(topics),
            },
         };

         await lib.request({
            method: "post",
            url: `http://${config.kafka.connectHost}/connectors`,
            bodyParams: ConnectorBody,
         });
         return 0;
      } else {
         throw new ErrorHandler(412, 5252, "This protocol is not supported");
      }
   }

   async updateSubscriptionSinkConnector({
      digital_twin_id,
      subscription_id,
      subscription_name,
      notification_url,
      topics,
      topicArr,
      subscription_protocol,
   }) {
      let hasDTopic = false; // "D"로 시작하는 요소가 있는지 여부를 추적하기 위한 변수
      let topicList = ""; // 최종 결과를 저장할 변수
      for (let i = 0; i < topicArr.length; i++) {
         if (topicArr[i].startsWith("D")) {
            if (!hasDTopic) {
               if (topicList !== "") {
                  topicList += ",";
               }
               topicList += "latestDigitalObjects"; // "D"로 시작하는 요소가 처음 발견된 경우
               hasDTopic = true;
            }
         } else {
            if (topicList !== "") {
               topicList += ",";
            }
            topicList += topicArr[i]; // "D"로 시작하지 않는 요소일 경우
         }
      }

      if (subscription_protocol === "http") {
         const ConnectorBody = {
            "connector.class":
               "org.kafka.connect.http.HttpSinkSubscriptionKeyFieldConnector",
            "tasks.max": "1",
            "http.api.url": notification_url,
            topics: topicList,
            "digital.twin.id": digital_twin_id,
            "subscription.id": subscription_id,
            "subscription.name": subscription_name,
            "request.method": "POST",
            headers:
               "Content-Type:application/json|Accept-Encoding: application/json",
            "key.converter": "org.apache.kafka.connect.storage.StringConverter",
            "value.converter":
               "org.apache.kafka.connect.storage.StringConverter",
            "key.topic": topics,
         };

         await lib.request({
            method: "put",
            url: `http://${config.kafka.connectHost}/connectors/SUB${subscription_id}/config`,
            bodyParams: ConnectorBody,
         });
         return 0;
      } else if (subscription_protocol === "mqtt") {
         let splitURLsink = notification_url.split("/");
         const ConnectorBody = {
            "connector.class":
               "org.kafka.connect.mqtt.MqttSubscriptionKeyFieldSinkConnector",
            topics: topicList,
            "mqtt.topic": splitURLsink[3],
            "mqtt.client.id": subscription_id,
            "mqtt.broker.uri": `tcp://${splitURLsink[2]}`,
            "key.converter": "org.apache.kafka.connect.storage.StringConverter",
            "value.converter":
               "org.apache.kafka.connect.storage.StringConverter",
            "key.topic": topics,
         };

         await lib.request({
            method: "put",
            url: `http://${config.kafka.connectHost}/connectors/SUB${subscription_id}/config`,
            bodyParams: ConnectorBody,
         });
         return 0;
      } else {
         throw new ErrorHandler(412, 5252, "This protocol is not supported");
      }
   }

   async createServiceSinkConnector({}) {}

   async createPostgresSinkConnector({ topic, table, type }) {
      const sinkConnectorBody = {
         name: "DigitalBase_" + topic,
         config: {
            "connector.class": "io.confluent.connect.jdbc.JdbcSinkConnector",
            "tasks.max": "1",
            topics: topic,
            "input.data.format": "JSON",
            "connection.url": `jdbc:postgresql://${config.postgresPool.host}:${config.postgresPool.port}/${config.postgresPool.database}`,
            "connection.host": config.postgresPool.host,
            "connection.port": config.postgresPool.port,
            "connection.user": "postgres",
            "connection.password": config.postgresPool.password,
            "db.name": config.postgresPool.database,
            "auto.create": "false",
            "table.name.format": table,
            "key.converter": "org.apache.kafka.connect.storage.StringConverter",
            "key.converter.schemas.enable": "false",
            "value.converter": "org.apache.kafka.connect.json.JsonConverter",
            "value.converter.schemas.enable": "false",
            "data.type": type,
         },
      };

      await lib.request({
         url: `http://${config.kafka.connectHost}/connectors`,
         bodyParams: sinkConnectorBody,
      });
      return 0;
   }

   /**
    *
    * @param {string} type (SIM , SUB)
    * @param {string} connectorName
    * @returns
    */
   async deleteSink({ type, connectorName }) {
      if (type) {
         await lib.request({
            method: "delete",
            url: `http://${config.kafka.connectHost}/connectors/${type}${connectorName}`,
            bodyParams: {},
         });
      } else {
         await lib.request({
            method: "delete",
            url: `http://${config.kafka.connectHost}/connectors/${connectorName}`,
            bodyParams: {},
         });
      }

      return 0;
   }
}

module.exports = Kafka;
