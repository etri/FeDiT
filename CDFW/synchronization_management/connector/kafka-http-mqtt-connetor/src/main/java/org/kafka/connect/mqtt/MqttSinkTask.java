package org.kafka.connect.mqtt;

import org.apache.kafka.clients.consumer.OffsetAndMetadata;
import org.apache.kafka.common.TopicPartition;
import org.apache.kafka.connect.sink.SinkRecord;
import org.apache.kafka.connect.sink.SinkTask;

import com.hivemq.client.mqtt.mqtt3.Mqtt3Client;
import com.hivemq.client.mqtt.mqtt3.Mqtt3BlockingClient;
import com.hivemq.client.mqtt.datatypes.MqttQos;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.net.URI;
import java.util.Collection;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

public class MqttSinkTask extends SinkTask {

    private final Logger logger = LoggerFactory.getLogger(MqttSinkConnector.class);
    private MqttSinkConnectorConfig config;
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
            int port = (u.getPort() > 0) ? u.getPort()
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
            logger.info("SUCCESS to connect MQTT broker({}:{}) for connector '{}'",
                    hp.host, hp.port, connectorName);
        } catch (Exception e) {
            logger.error("FAILED to connect MQTT broker({}:{}) for connector '{}'",
                    hp.host, hp.port, connectorName, e);
            throw new RuntimeException("MQTT connect failed", e);
        }
    }

    @Override
    public void start(Map<String, String> props) {
        config = new MqttSinkConnectorConfig(props);
        connectorName = props.get("name");
        mqttTopic = config.getString("mqtt.topic");
        mqttBrokerUri = config.getString("mqtt.broker.uri");
        mqttClientId = config.getString("mqtt.client.id");

        logger.info("Starting MqttSinkConnector '{}' with props: {}", connectorName, props);
        initMqttClient();
    }

    @Override
    public void put(Collection<SinkRecord> records) {
        if (records == null || records.isEmpty()) return;

        try {
            sendMqttMessage(records);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    private void sendMqttMessage(final Collection<SinkRecord> records) {
        for (SinkRecord record : records) {
            if (record.value() == null) continue;

            byte[] payload = record.value().toString().getBytes();
            try {
                if (mqttClient != null) {
                    mqttClient.publishWith()
                            .topic(mqttTopic)
                            .payload(payload)
                            .qos(MqttQos.AT_MOST_ONCE)  // QoS 0
                            .send();
                }
            } catch (Exception e) {
                logger.error("Failed to publish to MQTT topic '{}' (connector='{}')",
                        mqttTopic, connectorName, e);
            }
        }
    }

    @Override
    public void flush(Map<TopicPartition, OffsetAndMetadata> currentOffsets) {
        // ignored
    }

    @Override
    public void stop() {
        logger.info("Stopping MqttSinkConnector task '{}'", connectorName);
        try {
            if (mqttClient != null) {
                mqttClient.disconnect();
            }
        } catch (Exception e) {
            logger.warn("Error while disconnecting MQTT client for '{}'", connectorName, e);
        }
    }
}
