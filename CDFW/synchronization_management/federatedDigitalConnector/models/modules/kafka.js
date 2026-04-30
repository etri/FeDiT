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

  async GetConnectorConfig({ connector_id }) {
    const getConnector = await lib.request({
      method: "get",
      url: `http://${config.kafka.connectHost}/connectors/${connector_id}`,
    });

    return getConnector?.config ? getConnector.config : getConnector;
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
    });
    return 0;
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
