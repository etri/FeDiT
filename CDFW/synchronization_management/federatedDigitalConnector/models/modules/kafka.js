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

  async GetConnectorConfig({ connector_id }) {
    const getConnector = await lib.request({
      method: "get",
      url: `http://${config.kafka.connectHost}/connectors/${connector_id}`,
    });

    return getConnector?.config ? getConnector.config : getConnector;
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

  async deleteSink({ id }) {
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
        "connector.class": "io.aiven.connect.jdbc.JdbcSinkConnector",
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

  async createSourceHttpConnectorGroup({
    name,
    base_url,
    change_urls,
    digital_object_ids,
    digital_twin_ids,
    digital_object_data_interval,
  }) {
    let sourceConnectorBody = {
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

  async updateSourceHttpConnectorGroup({
    name,
    base_url,
    change_urls,
    digital_object_ids,
    digital_twin_ids,
    digital_object_data_interval,
  }) {
    let sourceConnectorBody = {
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
      "poll.interval.ms": digital_object_data_interval,
    };

    await lib.request({
      method: "put",
      url: `http://${config.kafka.connectHost}/connectors/${name}/config`,
      bodyParams: sourceConnectorBody,
    });
    return 0;
  }

  async createSourceMqttConnector({ id, url, digital_twin_id }) {
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
        "digital.object.id": id,
        "key.converter": "org.apache.kafka.connect.storage.StringConverter",
        "key.converter.schemas.enable": false,
        "value.converter": "org.apache.kafka.connect.storage.StringConverter",
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
