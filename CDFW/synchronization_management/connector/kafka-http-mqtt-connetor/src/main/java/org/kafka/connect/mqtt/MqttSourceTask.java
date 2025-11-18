package org.kafka.connect.mqtt;

import org.apache.kafka.connect.data.Schema;
import org.apache.kafka.connect.header.ConnectHeaders;
import org.apache.kafka.connect.source.SourceRecord;
import org.apache.kafka.connect.source.SourceTask;

import com.hivemq.client.mqtt.datatypes.MqttQos;
import com.hivemq.client.mqtt.mqtt3.Mqtt3AsyncClient;
import com.hivemq.client.mqtt.mqtt3.Mqtt3Client;
import com.hivemq.client.mqtt.mqtt3.message.publish.Mqtt3Publish;

import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.net.URI;
import java.time.Instant;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.BlockingQueue;
import java.util.concurrent.LinkedBlockingQueue;
import java.util.concurrent.TimeUnit;

public class MqttSourceTask extends SourceTask {

    private final Logger logger = LoggerFactory.getLogger(MqttSourceTask.class);

    private final BlockingQueue<SourceRecord> mqttRecordQueue = new LinkedBlockingQueue<>();
    private final DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss.SSS");

    private MqttSourceConnectorConfig config;
    private String connectorName;
    private String mqttTopic;
    private String mqttClientId;
    private String mqttBrokerUri;
    private Mqtt3AsyncClient mqttClient;

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

        mqttClient = Mqtt3Client.builder()
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

        mqttClient.connectWith()
                .keepAlive(30)
                .cleanSession(true)
                .send()
                .whenComplete((ack, err) -> {
                    if (err != null) {
                        logger.error("FAILED to connect MQTT broker({}:{}) for connector '{}'", hp.host, hp.port, connectorName, err);
                    } else {
                        logger.info("SUCCESS to connect MQTT broker({}:{}) for connector '{}'", hp.host, hp.port, connectorName);
                        subscribeTopic();
                    }
                });
    }

    private void subscribeTopic() {
        mqttClient.subscribeWith()
                .topicFilter(mqttTopic)
                .qos(MqttQos.AT_MOST_ONCE)
                .callback(this::handleIncomingMessage)
                .send()
                .whenComplete((subAck, err) -> {
                    if (err != null) {
                        logger.error("FAILED to subscribe MQTT topic({}) for connector '{}'", mqttTopic, connectorName, err);
                    } else {
                        logger.info("SUCCESS to subscribe MQTT topic({}) for connector '{}'", mqttTopic, connectorName);
                    }
                });
    }

    private void handleIncomingMessage(Mqtt3Publish message) {
        try {
            String payload = new String(message.getPayloadAsBytes());
            logger.debug("MQTT message arrived on topic '{}': {}", message.getTopic(), payload);

            JSONObject kafka_key = new JSONObject();
            kafka_key.put("sensor_id", config.getString("sensor.id"));
            String strKafkaKey = kafka_key.toString();

            JSONObject jsonRecordObject = new JSONObject(payload);
            JSONObject valueObjectMessage = new JSONObject();

            if (jsonRecordObject.has("data")) {
                Object dataValue = jsonRecordObject.get("data");
                if (jsonRecordObject.has("location")) {
                    Object locationValue = jsonRecordObject.get("location");
                    valueObjectMessage.put("data", dataValue);
                    valueObjectMessage.put("location", locationValue);
                } else {
                    valueObjectMessage.put("data", dataValue);
                    valueObjectMessage.put("location", new JSONObject());
                }
            } else {
                valueObjectMessage.put("data", jsonRecordObject);
                valueObjectMessage.put("location", new JSONObject());
            }

            Instant now = Instant.now();
            valueObjectMessage.put("digital_twin_id", config.getString("digital.twin.id"));
            valueObjectMessage.put("sensor_id", config.getString("sensor.id"));
            valueObjectMessage.put("rowtime", now.atZone(ZoneOffset.UTC).format(formatter));

            mqttRecordQueue.put(dataConvert(message.getTopic().toString(), valueObjectMessage.toString(), strKafkaKey));
        } catch (Exception e) {
            logger.error("ERROR creating SourceRecord from MQTT message: {}", e.getMessage(), e);
        }
    }

    @Override
    public void start(Map<String, String> props) {
        config = new MqttSourceConnectorConfig(props);
        connectorName = props.get("name");
        mqttTopic = config.getString("mqtt.topic");
        mqttBrokerUri = config.getString("mqtt.broker.uri");
        mqttClientId = config.getString("mqtt.client.id");

        logger.info("Starting MqttSourceConnector with connector name '{}'", connectorName);
        logger.info("MqttSourceTask config: {}", props);
        initMqttClient();
    }

    @Override
    public List<SourceRecord> poll() throws InterruptedException {
        List<SourceRecord> records = new ArrayList<>();
        SourceRecord rec = mqttRecordQueue.poll(100, TimeUnit.MILLISECONDS);
        if (rec != null) {
            records.add(rec);
            mqttRecordQueue.drainTo(records, 49); // 한 번에 최대 50개
        }
        return records;
    }

    protected SourceRecord dataConvert(String topic, String mqttMessage, String strKafkaKey) {
        ConnectHeaders headers = new ConnectHeaders();
        SourceRecord sourceRecord = new SourceRecord(
                new HashMap<>(),
                new HashMap<>(),
                config.getString("kafka.topic"),
                (Integer) null,
                Schema.STRING_SCHEMA,
                strKafkaKey,
                Schema.STRING_SCHEMA,
                mqttMessage,
                System.currentTimeMillis(),
                headers
        );
        logger.debug("Converted MQTT message → SourceRecord: {}", sourceRecord);
        return sourceRecord;
    }

    @Override
    public void stop() {
        logger.info("Stopping MqttSourceConnector task '{}'", connectorName);
        try {
            if (mqttClient != null) {
                mqttClient.disconnect();
            }
        } catch (Exception e) {
            logger.warn("Error while disconnecting MQTT client for '{}'", connectorName, e);
        }
    }
}
