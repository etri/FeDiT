package org.kafka.connect.mqtt;

import com.jayway.jsonpath.JsonPath;
import org.apache.kafka.clients.consumer.OffsetAndMetadata;
import org.apache.kafka.common.TopicPartition;
import org.apache.kafka.connect.sink.SinkRecord;
import org.apache.kafka.connect.sink.SinkTask;

import com.hivemq.client.mqtt.datatypes.MqttQos;
import com.hivemq.client.mqtt.mqtt3.Mqtt3Client;
import com.hivemq.client.mqtt.mqtt3.Mqtt3BlockingClient;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.net.URI;
import java.util.*;
import java.util.concurrent.TimeUnit;

public class MqttSubscriptionKeyFieldSinkTask extends SinkTask {

    private final Logger logger = LoggerFactory.getLogger(MqttSubscriptionKeyFieldSinkTask.class);
    private MqttSubscriptionKeyFieldSinkConnectorConfig config;

    private String key_topic;
    private String resource_type;
    private String connectorName;
    private String mqttTopic;
    private String mqttClientId;
    private String mqttBrokerUri;
    private Mqtt3BlockingClient mqttClient;

    @Override
    public String version() {
        return "1.0";
    }

    private static class HostPort {
        final String host;
        final int port;
        HostPort(String host, int port) { this.host = host; this.port = port; }
    }

    private HostPort parseBroker(String uri) {
        try {
            URI u = URI.create(uri.replace("mqtt://", "tcp://"));
            String host = (u.getHost() != null) ? u.getHost() : "localhost";
            int port = (u.getPort() > 0)
                    ? u.getPort()
                    : ("ssl".equalsIgnoreCase(u.getScheme()) ? 8883 : 1883);
            return new HostPort(host, port);
        } catch (Exception e) {
            logger.warn("Invalid MQTT broker URI '{}', fallback to localhost:1883", uri, e);
            return new HostPort("localhost", 1883);
        }
    }

    private void initMqttClient() {
        HostPort hp = parseBroker(mqttBrokerUri);

        var asyncClient = Mqtt3Client.builder()
                .identifier((mqttClientId != null && !mqttClientId.isEmpty())
                        ? mqttClientId : UUID.randomUUID().toString())
                .serverHost(hp.host)
                .serverPort(hp.port)
                .automaticReconnect()
                    .initialDelay(1, TimeUnit.SECONDS)
                    .maxDelay(30, TimeUnit.SECONDS)
                    .applyAutomaticReconnect()
                .build()
                .toAsync();

        mqttClient = asyncClient.toBlocking();

        try {
            mqttClient.connectWith()
                    .keepAlive(30)
                    .cleanSession(true)
                    .send();
            logger.info("[MqttSubscriptionKeyFieldSinkTask] Connected to MQTT broker ({}:{})", hp.host, hp.port);
        } catch (Exception e) {
            logger.error("[MqttSubscriptionKeyFieldSinkTask] Failed to connect MQTT broker ({}:{})", hp.host, hp.port, e);
            throw new RuntimeException("MQTT connect failed", e);
        }

        try {
            mqttClient.subscribeWith()
                    .topicFilter(mqttTopic)
                    .qos(MqttQos.AT_MOST_ONCE)
                    .send();
            logger.info("[MqttSubscriptionKeyFieldSinkTask] Subscribed topic '{}'", mqttTopic);
        } catch (Exception e) {
            logger.warn("[MqttSubscriptionKeyFieldSinkTask] Subscription failed for topic '{}'", mqttTopic, e);
        }
    }

    @Override
    public void start(Map<String, String> props) {
        config = new MqttSubscriptionKeyFieldSinkConnectorConfig(props);
        connectorName = props.get("name");
        mqttTopic = config.getString("mqtt.topic");
        mqttBrokerUri = config.getString("mqtt.broker.uri");
        mqttClientId = config.getString("mqtt.client.id");
        key_topic = config.getString("key.topic");
        resource_type = config.getString("resource.type");

        logger.info("[MqttSubscriptionKeyFieldSinkTask] Starting connector '{}'", connectorName);
        initMqttClient();
    }

    @Override
    public void put(Collection<SinkRecord> records) {
        if (records == null || records.isEmpty()) return;

        try {
            if ("digital_object".equals(resource_type)) {
                handleDigitalObjects(records);
            } else if ("federated_digital_object".equals(resource_type)) {
                handleFederatedObjects(records);
            } else {
                logger.warn("Unsupported resource_type: {}", resource_type);
            }
        } catch (Exception e) {
            logger.error("Error in MQTT SinkTask put(): {}", e.getMessage(), e);
        }
    }

    private void handleDigitalObjects(final Collection<SinkRecord> records) {
        for (SinkRecord record : records) {
            if (record == null || record.value() == null) continue;

            String record_topic = record.topic();
            String recordValue = record.value().toString();

            if (!"latestDigitalObjects".equals(record_topic)) {
                sendMqttMessageSafe(recordValue);
                continue;
            }

            try {
                String digital_Id = JsonPath.read(recordValue, "$.digital_object_id");
                for (String topic : key_topic.split(",")) {
                    if (digital_Id.equals(topic)) {
                        sendMqttMessageSafe(recordValue);
                    }
                }
            } catch (Exception e) {
                logger.debug("DigitalObject parse error: {}", e.getMessage());
            }
        }
    }

    private void handleFederatedObjects(final Collection<SinkRecord> records) {
        for (SinkRecord record : records) {
            if (record == null || record.value() == null) continue;

            String record_topic = record.topic();
            String recordValue = record.value().toString();

            if (!"latestFederatedDigitalObjects".equals(record_topic)) {
                sendMqttMessageSafe(recordValue);
                continue;
            }

            try {
                String federated_Id = JsonPath.read(recordValue, "$.federated_digital_object_id");
                for (String topic : key_topic.split(",")) {
                    if (federated_Id.equals(topic)) {
                        sendMqttMessageSafe(recordValue);
                    }
                }
            } catch (Exception e) {
                logger.debug("FederatedObject parse error: {}", e.getMessage());
            }
        }
    }

    private void sendMqttMessageSafe(String value) {
        try {
            mqttClient.publishWith()
                    .topic(mqttTopic)
                    .payload(value.getBytes())
                    .qos(MqttQos.AT_MOST_ONCE)
                    .send();
        } catch (Exception e) {
            logger.error("Failed to send MQTT message: {}", e.getMessage());
        }
    }

    @Override
    public void flush(Map<TopicPartition, OffsetAndMetadata> currentOffsets) {
        // ignored
    }

    @Override
    public void stop() {
        logger.info("[MqttSubscriptionKeyFieldSinkTask] Stopping connector '{}'", connectorName);
        try {
            if (mqttClient != null) mqttClient.disconnect();
        } catch (Exception e) {
            logger.warn("Error during MQTT disconnect: {}", e.getMessage());
        }
    }
}
