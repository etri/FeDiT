// services/kafka/index.js (예시 경로: 원래 파일 위치 그대로 교체)
const config = require("../../config");
const lib = require("../../lib");
const { connectHost } = config.kafka;
const [hostname, port] = connectHost.split(":");
const ErrorHandler = require("../../lib/error-handler");

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

  /**
   * KafkaJS용 토픽 생성
   * - 존재해도 OK (idempotent)
   * - 필요한 경우 파티션/복제 계수 옵션 추가 가능
   */
  async createTopics({ topic, numPartitions = 1, replicationFactor = 1 }) {
    if (!global.kafka) {
      throw new Error(
        "KafkaJS client(global.kafka)가 초기화되어 있지 않습니다."
      );
    }
    const admin = global.kafka.admin();
    try {
      await admin.connect();
      await admin.createTopics({
        waitForLeaders: true,
        topics: [
          {
            topic,
            numPartitions,
            replicationFactor,
          },
        ],
      });
      // 로그는 선택
      if (typeof logger !== "undefined") {
        logger.info(`[Kafka] ensure topic created: ${topic}`);
      }
      return 0;
    } catch (err) {
      if (typeof logger !== "undefined") logger.error(err);
      throw err;
    } finally {
      try {
        await admin.disconnect();
      } catch (_) {}
    }
  }

  async GetConnectorCheck({ connectors }) {
    const getConnectors = await lib.request({
      method: "get",
      url: `http://${config.kafka.connectHost}/connectors`,
    });
    const data = new Set(getConnectors.data);
    for (const connector of connectors) {
      if (!data.has(connector)) {
        return false;
      }
    }
    return true;
  }

  async checkAndCreateConnector(connectorNames, createCallback) {
    const getConnectors = await lib.request({
      method: "get",
      url: `http://${config.kafka.connectHost}/connectors`,
    });

    const existingConnectors = new Set(getConnectors.data);
    for (const connector of connectorNames) {
      if (!existingConnectors.has(connector.connector_id)) {
        await createCallback(connector);
      }
    }
    return;
  }

  /**
   * KafkaJS producer.send 사용
   *  - topic: string
   *  - kafkaKey: string|Buffer|null
   *  - data: string|Buffer|object(→ 자동 stringify)
   */
  async kafkaProducer({ topic, kafkaKey, data }) {
    if (!global.producer) {
      throw new Error(
        "KafkaJS producer(global.producer)가 연결되지 않았습니다."
      );
    }

    const value =
      typeof data === "string" || Buffer.isBuffer(data)
        ? data
        : JSON.stringify(data);

    try {
      await global.producer.send({
        topic,
        messages: [{ key: kafkaKey != null ? String(kafkaKey) : null, value }],
      });
      return 0;
    } catch (err) {
      if (typeof logger !== "undefined") logger.error(err);
      throw err;
    }
  }

  async createSourceHttpConnectorGroup({
    name,
    base_url,
    change_urls,
    digital_object_ids,
    digital_twin_ids,
    digital_object_data_interval,
  }) {
    const sourceConnectorBody = {
      name: `${name}`,
      config: {
        "connector.class": "org.kafka.connect.http.HttpSourceGroupConnector",
        "kafka.topic": "UnalliedDigitalObjects",
        "api.base.url": base_url,
        "api.change.url": change_urls,
        "digital.twin.id": digital_twin_ids,
        "digital.object.id": digital_object_ids,
        headers:
          "Content-Type:application/json|Accept-Encoding: application/json",
        "key.converter": "org.apache.kafka.connect.storage.StringConverter",
        "value.converter": "org.apache.kafka.connect.storage.StringConverter",
        "data.source.format": "json",
      },
    };

    if (digital_object_data_interval) {
      sourceConnectorBody.config["poll.interval.ms"] =
        digital_object_data_interval;
    }
    await lib.request({
      url: `http://${config.kafka.connectHost}/connectors`,
      bodyParams: sourceConnectorBody,
    });
    return 0;
  }

  async createKeyTopicDistributeSink({ topic, key, type }) {
    const ConnectorBody = {
      name: `keyTopicDistSink_${topic}`,
      config: {
        "connector.class":
          "com.keti.connector.kafka.KafkaSinkKeyTopicConnector",
        "kafka.sink.bootstrap": config.kafka.host,
        "tasks.max": "1",
        topics: topic,
        "value.converter": "org.apache.kafka.connect.storage.StringConverter",
        "key.converter": "org.apache.kafka.connect.storage.StringConverter",
        "kafka.key.field": key,
        "topic.type": type,
      },
    };

    await lib.request({
      method: "post",
      url: `http://${config.kafka.connectHost}/connectors`,
      bodyParams: ConnectorBody,
    });

    return 0;
  }

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
      name: `${simulation_id}`,
      config: {
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
        topics: "latestFederatedDigitalObjects",
        digital_twin_id,
        "simulation.id": simulation_id,
        "simulation.name": simulation_name,
        "resource.type": resource_type,
        "include.input": include_input,
        "key.field": "federated_digital_object_id",
        "key.topic": simulation_subject,
        "postgres.password": config.postgresPool.password,
        "postgres.url": `jdbc:postgresql://${config.postgresPool.host}:${config.postgresPool.port}/${config.postgresPool.database}`,
        "postgres.user": config.postgresPool.user,
      },
    };

    ConnectorBody.config["simulation.attribute"] = simulation_attribute || "";

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
      topics: "latestFederatedDigitalObjects",
      digital_twin_id,
      "simulation.id": simulation_id,
      "simulation.name": simulation_name,
      "resource.type": resource_type,
      "include.input": include_input,
      "key.field": "federated_digital_object_id",
      "key.topic": simulation_subject,
      "postgres.password": config.postgresPool.password,
      "postgres.url": `jdbc:postgresql://${config.postgresPool.host}:${config.postgresPool.port}/${config.postgresPool.database}`,
      "postgres.user": config.postgresPool.user,
    };

    if (!simulation_attribute) {
      ConnectorBody["simulation.attribute"] = "";
    }

    await lib.request({
      method: "put",
      url: `http://${config.kafka.connectHost}/connectors/${simulation_id}/config`,
      bodyParams: ConnectorBody,
    });

    return 0;
  }

  async createSubscriptionSinkConnector({
    federated_digital_twin_id,
    subscription_id,
    subscription_name,
    notification_url,
    topics,
    topicList,
    subscription_protocol,
    filtering_action_list,
    filtering_condition_list,
  }) {
    if (subscription_protocol === "http") {
      const ConnectorBody = {
        name: `${subscription_id}`,
        config: {
          "connector.class":
            "org.kafka.connect.http.HttpSinkSubscriptionKeyFieldConnector",
          "tasks.max": "1",
          "http.api.url": notification_url,
          topics: topicList,
          "federated.digital.twin.id": federated_digital_twin_id,
          "subscription.id": subscription_id,
          "subscription.name": subscription_name,
          "request.method": "POST",
          headers:
            "Content-Type:application/json|Accept-Encoding: application/json",
          "key.converter": "org.apache.kafka.connect.storage.StringConverter",
          "value.converter": "org.apache.kafka.connect.storage.StringConverter",
          "key.topic": topics,
          "resource.type": "federated_digital_object",
        },
      };

      await lib.request({
        method: "post",
        url: `http://${config.kafka.connectHost}/connectors`,
        bodyParams: ConnectorBody,
      });
      return 0;
    } else if (subscription_protocol === "mqtt") {
      const mqttBrokerUri = notification_url.split("//")[1].split("/")[0];
      const mqttTopic = notification_url
        .split("//")[1]
        .split("/")
        .slice(1)
        .join("/");

      const ConnectorBody = {
        name: `${subscription_id}`,
        config: {
          "connector.class":
            "org.kafka.connect.mqtt.MqttSubscriptionActionSinkConnector",
          topics: topicList,
          "mqtt.topic": mqttTopic,
          "mqtt.client.id": subscription_id,
          "mqtt.broker.uri": `tcp://${mqttBrokerUri}`,
          "key.converter": "org.apache.kafka.connect.storage.StringConverter",
          "value.converter": "org.apache.kafka.connect.storage.StringConverter",
          "key.topic": topics,
          "resource.type": "federated_digital_object",
        },
      };

      if (filtering_action_list != null) {
        ConnectorBody.config["filtering.action.list"] = lib.kafkaEnum(
          filtering_action_list
        );
        ConnectorBody.config["filtering.condition.list"] = lib.kafkaEnum(
          filtering_condition_list
        );
      }

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
    federated_digital_twin_id,
    subscription_id,
    subscription_name,
    notification_url,
    topics,
    topicList,
    subscription_protocol,
    filtering_action_list,
    filtering_condition_list,
  }) {
    if (subscription_protocol === "http") {
      const ConnectorBody = {
        "connector.class":
          "org.kafka.connect.http.HttpSinkSubscriptionKeyFieldConnector",
        "tasks.max": "1",
        "http.api.url": notification_url,
        topics: topicList,
        "federated.digital.twin.id": federated_digital_twin_id,
        "subscription.id": subscription_id,
        "subscription.name": subscription_name,
        "request.method": "POST",
        headers:
          "Content-Type:application/json|Accept-Encoding: application/json",
        "key.converter": "org.apache.kafka.connect.storage.StringConverter",
        "value.converter": "org.apache.kafka.connect.storage.StringConverter",
        "key.topic": topics,
        "resource.type": "federated_digital_object",
      };

      await lib.request({
        method: "put",
        url: `http://${config.kafka.connectHost}/connectors/${subscription_id}/config`,
        bodyParams: ConnectorBody,
      });
      return 0;
    } else if (subscription_protocol === "mqtt") {
      const mqttBrokerUri = notification_url.split("//")[1].split("/")[0];
      const mqttTopic = notification_url
        .split("//")[1]
        .split("/")
        .slice(1)
        .join("/");

      const ConnectorBody = {
        "connector.class":
          "org.kafka.connect.mqtt.MqttSubscriptionActionSinkConnector",
        topics: topicList,
        "mqtt.topic": mqttTopic,
        "mqtt.client.id": subscription_id,
        "mqtt.broker.uri": `tcp://${mqttBrokerUri}`,
        "key.converter": "org.apache.kafka.connect.storage.StringConverter",
        "value.converter": "org.apache.kafka.connect.storage.StringConverter",
        "key.topic": topics,
        "resource.type": "federated_digital_object",
      };

      if (filtering_action_list != null) {
        ConnectorBody["filtering.action.list"] = filtering_action_list;
        ConnectorBody["filtering.condition.list"] = filtering_condition_list;
      }

      await lib.request({
        method: "put",
        url: `http://${config.kafka.connectHost}/connectors/${subscription_id}/config`,
        bodyParams: ConnectorBody,
      });
      return 0;
    } else {
      throw new ErrorHandler(412, 5252, "This protocol is not supported");
    }
  }

  /**
   * @param {string} type (SIM , SUB, DigitalBase_)
   * @param {string} connectorName
   */
  async deleteSink({ type, connectorName }) {
    const url = type
      ? `http://${config.kafka.connectHost}/connectors/${type}${connectorName}`
      : `http://${config.kafka.connectHost}/connectors/${connectorName}`;

    await lib.request({
      method: "delete",
      url,
      bodyParams: {},
    });

    return 0;
  }

  async connectorOperation({ name, action }) {
    const result = await lib.request({
      method: "put",
      url: `http://${config.kafka.connectHost}/connectors/${name}/${action}`,
    });

    return result;
  }
}

module.exports = Kafka;
