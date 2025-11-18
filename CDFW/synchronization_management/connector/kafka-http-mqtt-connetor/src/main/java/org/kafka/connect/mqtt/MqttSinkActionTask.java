package org.kafka.connect.mqtt;

import com.jayway.jsonpath.JsonPath;
import org.apache.kafka.clients.consumer.OffsetAndMetadata;
import org.apache.kafka.common.TopicPartition;
import org.apache.kafka.connect.sink.SinkRecord;
import org.apache.kafka.connect.sink.SinkTask;

import com.hivemq.client.mqtt.mqtt3.Mqtt3Client;
import com.hivemq.client.mqtt.mqtt3.Mqtt3BlockingClient;
import com.hivemq.client.mqtt.mqtt3.message.publish.Mqtt3Publish;

import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.net.URI;
import java.util.*;

public class MqttSinkActionTask extends SinkTask {
    private final Logger logger = LoggerFactory.getLogger(MqttSinkActionConnector.class);

    MqttSinkActionConnectorConfig config;
    String key_topic;
    String resource_type;

    private String connectorName;
    private String mqttTopic;
    private String mqttClientId;
    private String mqttBrokerUri;

    private List filtering_condition;
    private List filtering_action;

    private Mqtt3BlockingClient mqttClient; // HiveMQ Blocking Client

    @Override
    public String version() {
        return "1.0";
    }

    private static class HostPort {
        final String host;
        final int port;
        HostPort(String host, int port) { this.host = host; this.port = port; }
    }

    private HostPort parseMqttUri(String uri) {
        try {
            // 예: tcp://127.0.0.1:1883, ssl://broker:8883
            URI u = URI.create(uri.replace("mqtt://", "tcp://"));
            String host = (u.getHost() != null) ? u.getHost() : "localhost";
            int port = (u.getPort() > 0) ? u.getPort() : ("ssl".equalsIgnoreCase(u.getScheme()) ? 8883 : 1883);
            return new HostPort(host, port);
        } catch (Exception e) {
            logger.warn("Invalid MQTT URI '{}', fallback to localhost:1883", uri);
            return new HostPort("localhost", 1883);
        }
    }

    private void initMqttClient() {
        HostPort hp = parseMqttUri(mqttBrokerUri);

        // Mqtt3Client builder
        Mqtt3Client asyncClient = Mqtt3Client.builder()
                .identifier(mqttClientId != null && !mqttClientId.isEmpty() ? mqttClientId : UUID.randomUUID().toString())
                .serverHost(hp.host)
                .serverPort(hp.port)
                .automaticReconnect()            // 자동 재연결
                    .applyAutomaticReconnect()
                .build();

        mqttClient = asyncClient.toBlocking();

        // connect with keep alive
        mqttClient.connectWith()
                .keepAlive(30)                  // Paho의 setKeepAliveInterval(30) 대응
                .cleanSession(true)
                .send();

        logger.info("SUCCESS to connect MQTT broker({}:{}) with connector '{}'", hp.host, hp.port, connectorName);

        // (옵션) 구독이 정말 필요하다면 아래 주석 해제
        // asyncClient.toAsync().subscribeWith()
        //         .topicFilter(mqttTopic)
        //         .callback(msg -> {
        //             logger.debug("Received message on {}: {}", msg.getTopic(), new String(msg.getPayloadAsBytes()));
        //         })
        //         .send();
        // logger.info("SUCCESS to subscribe MQTT topic({})", mqttTopic);
    }

    @Override
    public void start(Map<String, String> props) {
        config = new MqttSinkActionConnectorConfig(props);
        connectorName   = props.get("name");
        mqttTopic       = config.getString("mqtt.topic");
        mqttBrokerUri   = config.getString("mqtt.broker.uri");  // e.g., tcp://host:1883
        mqttClientId    = config.getString("mqtt.client.id");

        filtering_action    = config.getList("filtering.action.list");
        filtering_condition = config.getList("filtering.condition.list");

        key_topic     = config.getString("key.topic");
        resource_type = config.getString("resource.type");

        initMqttClient();
    }

    @Override
    public void put(Collection<SinkRecord> records) {
        for (SinkRecord record : records) {
            if (record.value() == null) {
                continue;
            }
            try {
                String value = record.value().toString();
                if (!filtering_condition.isEmpty()) {
                    getMatchingAction(value);
                } else {
                    logger.info("@@@ filtering_condition.isEmpty()");
                    logger.info("filtering_action : {}", filtering_action);
                    logger.info("filtering_condition : {}", filtering_condition);
                }
            } catch (Exception e) {
                throw new RuntimeException(e);
            }
        }
    }

    private boolean isFilteringListMatch(String value, String condition) {
        return !JsonPath.read(value, condition).toString().equals("[]");
    }

    private void getMatchingAction(String value) {
        ArrayList<List> filtering_condition_lists = new ArrayList<>(Arrays.asList(filtering_condition));
        ArrayList<List> filtering_action_lists    = new ArrayList<>(Arrays.asList(filtering_action));
        List filtering_condition_list = filtering_condition_lists.get(0);
        List filtering_action_list    = filtering_action_lists.get(0);

        if (filtering_condition_list.size() != filtering_action_list.size()) {
            logger.warn("filtering_condition_list.size() != filtering_action_list.size()");
        }

        for (int i = 0; i < filtering_condition_list.size(); i++) {
            String condition = filtering_condition_list.get(i).toString();
            String action    = filtering_action_list.get(i).toString();
            if (isFilteringListMatch(value, condition)) {
                JSONObject jsonObject = new JSONObject();
                jsonObject.put("digital_object_id", config.getString("digital.object.id"));
                jsonObject.put("actionFunc", action);
                jsonObject.put("digital_twin_data", value);
                sendMqttMessage(jsonObject.toString());
            }
        }
    }

    private void sendMqttMessage(String payload) {
        if (mqttClient == null) {
            logger.error("MQTT client is not initialized");
            return;
        }
        try {
            mqttClient.publishWith()
                    .topic(mqttTopic)
                    .qos(com.hivemq.client.mqtt.datatypes.MqttQos.AT_MOST_ONCE)
                    .payload(payload.getBytes())
                    .send();
        } catch (Exception e) {
            logger.error("Failed to publish to topic {}: {}", mqttTopic, e.getMessage(), e);
        }
    }

    @Override
    public void flush(Map<TopicPartition, OffsetAndMetadata> currentOffsets) {
        // ignored
    }

    @Override
    public void stop() {
        logger.info("Stopping MqttSinkActionConnector task");
        try {
            if (mqttClient != null && mqttClient.getState().isConnected()) {
                mqttClient.disconnect();
            }
        } catch (Exception e) {
            logger.warn("Error during MQTT disconnect: {}", e.getMessage());
        }
    }
}
