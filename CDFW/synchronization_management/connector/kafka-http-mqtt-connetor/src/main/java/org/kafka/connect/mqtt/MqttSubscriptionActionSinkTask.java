package org.kafka.connect.mqtt;

import com.jayway.jsonpath.JsonPath;
import org.apache.kafka.clients.consumer.OffsetAndMetadata;
import org.apache.kafka.common.TopicPartition;
import org.apache.kafka.connect.sink.SinkRecord;
import org.apache.kafka.connect.sink.SinkTask;

import com.hivemq.client.mqtt.datatypes.MqttQos;
import com.hivemq.client.mqtt.mqtt3.Mqtt3Client;
import com.hivemq.client.mqtt.mqtt3.Mqtt3BlockingClient;

import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.net.URI;
import java.util.*;
import java.util.concurrent.TimeUnit;

public class MqttSubscriptionActionSinkTask extends SinkTask {

    private final Logger logger = LoggerFactory.getLogger(MqttSubscriptionActionSinkConnector.class);
    private MqttSubscriptionActionSinkConnectorConfig config;
    private String key_topic;
    private String resource_type;
    private String connectorName;
    private String mqttTopic;
    private String mqttClientId;
    private String mqttBrokerUri;
    private List filtering_condition;
    private List filtering_action;
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
            logger.info("[MqttSubscriptionActionSinkTask] Connected to MQTT broker({}:{}) '{}'", hp.host, hp.port, connectorName);
        } catch (Exception e) {
            logger.error("[MqttSubscriptionActionSinkTask] Failed to connect to MQTT broker({}:{}) '{}'", hp.host, hp.port, connectorName, e);
            throw new RuntimeException("MQTT connect failed", e);
        }

        try {
            mqttClient.subscribeWith()
                    .topicFilter(mqttTopic)
                    .qos(MqttQos.AT_MOST_ONCE)
                    .send();
            logger.info("[MqttSubscriptionActionSinkTask] Subscribed MQTT topic({}) '{}'", mqttTopic, connectorName);
        } catch (Exception e) {
            logger.warn("[MqttSubscriptionActionSinkTask] Subscription failed topic({}) '{}'", mqttTopic, connectorName, e);
        }
    }

    @Override
    public void start(Map<String, String> props) {
        config = new MqttSubscriptionActionSinkConnectorConfig(props);
        connectorName = props.get("name");
        mqttTopic = config.getString("mqtt.topic");
        mqttBrokerUri = config.getString("mqtt.broker.uri");
        mqttClientId = config.getString("mqtt.client.id");
        key_topic = config.getString("key.topic");
        resource_type = config.getString("resource.type");
        filtering_action = config.getList("filtering.action.list");
        filtering_condition = config.getList("filtering.condition.list");

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
            logger.error("Error in MQTT Sink put(): {}", e.getMessage(), e);
        }
    }

    private boolean isFilteringListMatch(String value, String condition) {
        try {
            return !JsonPath.read(value, condition).toString().equals("[]");
        } catch (Exception e) {
            logger.debug("JsonPath evaluation error: {}", e.getMessage());
            return false;
        }
    }

    private void getMatchingAction(String value, String record_value) {
        List<List> condLists = new ArrayList<>(Arrays.asList(filtering_condition));
        List<List> actionLists = new ArrayList<>(Arrays.asList(filtering_action));

        List condList = condLists.get(0);
        List actList = actionLists.get(0);

        for (int i = 0; i < condList.size(); i++) {
            String condition = condList.get(i).toString();
            String action = actList.get(i).toString();

            JSONObject jsonObject = new JSONObject(record_value);
            if (isFilteringListMatch(value, condition)) {
                jsonObject.put("actionFunc", action);
            }
            sendMqttMessageSafe(jsonObject.toString());
        }
    }

    private void sendMqttMessageSafe(String value) {
        try {
            if (mqttClient != null) {
                mqttClient.publishWith()
                        .topic(mqttTopic)
                        .payload(value.getBytes())
                        .qos(MqttQos.AT_MOST_ONCE)
                        .send();
            }
        } catch (Exception e) {
            logger.error("Failed to send MQTT message: {}", e.getMessage(), e);
        }
    }

    private void handleDigitalObjects(Collection<SinkRecord> records) {
        for (SinkRecord record : records) {
            if (record == null || record.value() == null) continue;
            String record_topic = record.topic();
            String record_value = record.value().toString();

            if (!"latestDigitalObjects".equals(record_topic)) {
                sendMqttMessageSafe(record_value);
                continue;
            }

            try {
                String digital_Id = JsonPath.read(record_value, "$.digital_object_id");
                String[] key_topicArray = key_topic.split(",");
                for (String topic : key_topicArray) {
                    if (digital_Id.equals(topic)) {
                        if (!filtering_condition.get(0).equals("default")) {
                            JSONObject jsonRecordObject = new JSONObject(record_value);
                            String data = jsonRecordObject.optString("data", "{}");
                            getMatchingAction(data, record_value);
                        } else {
                            sendMqttMessageSafe(record_value);
                        }
                    }
                }
            } catch (Exception e) {
                logger.warn("DigitalObject processing error: {}", e.getMessage());
            }
        }
    }

    private void handleFederatedObjects(Collection<SinkRecord> records) {
        for (SinkRecord record : records) {
            if (record == null || record.value() == null) continue;
            String record_topic = record.topic();
            String value = record.value().toString();

            String[] key_topicArray = key_topic.split(",");
            for (String topic : key_topicArray) {
                try {
                    String idPath;
                    switch (record_topic) {
                        case "latestFederatedDigitalObjects":
                        case "fdo_control_result":
                            idPath = "$.federated_digital_object_id";
                            break;
                        case "UnalliedDigitalObjects":
                        case "do_control_result":
                            idPath = "$.digital_object_id";
                            break;
                        default:
                            sendMqttMessageSafe(value);
                            continue;
                    }
                    String digital_Id = JsonPath.read(value, idPath);
                    if (digital_Id.equals(topic)) {
                        sendMqttMessageSafe(value);
                    }
                } catch (Exception e) {
                    logger.debug("FederatedObject topic({}) parse error: {}", record_topic, e.getMessage());
                    sendMqttMessageSafe(value);
                }
            }
        }
    }

    @Override
    public void flush(Map<TopicPartition, OffsetAndMetadata> currentOffsets) {
        // ignored
    }

    @Override
    public void stop() {
        logger.info("Stopping MqttSubscriptionActionSinkTask '{}'", connectorName);
        try {
            if (mqttClient != null) mqttClient.disconnect();
        } catch (Exception e) {
            logger.warn("Error during MQTT disconnect: {}", e.getMessage());
        }
    }
}
