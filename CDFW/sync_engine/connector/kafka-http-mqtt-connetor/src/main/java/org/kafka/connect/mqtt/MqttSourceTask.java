package org.kafka.connect.mqtt;

import org.apache.kafka.connect.data.Schema;
import org.apache.kafka.connect.header.ConnectHeaders;
import org.apache.kafka.connect.source.SourceRecord;
import org.apache.kafka.connect.source.SourceTask;
import org.eclipse.paho.client.mqttv3.*;
import org.eclipse.paho.client.mqttv3.persist.MemoryPersistence;
import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.Instant;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.BlockingQueue;
import java.util.concurrent.LinkedBlockingQueue;

public class MqttSourceTask extends SourceTask implements MqttCallback {

    private final Logger logger = LoggerFactory.getLogger(MqttSourceTask.class);
    BlockingQueue<SourceRecord> mqttRecordQueue = new LinkedBlockingQueue<SourceRecord>();
    Instant now;
    DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss.SSS");
    MqttSourceConnectorConfig config;
    private String connectorName;
    private String mqttTopic;
    private String mqttClientId;
    private String mqttBrokerUri;
    private MqttClient mqttClient;
    private MqttConnectOptions mqttOptions;

    @Override
    public String version() {
        return "1.0";
    }

    private void initMqttClient() {
        // init variables
        mqttOptions = new MqttConnectOptions();
        mqttOptions.setCleanSession(true);
        mqttOptions.setKeepAliveInterval(30);

        // mqtt connect
        try {
            mqttClient = new MqttClient(mqttBrokerUri, mqttClientId, new MemoryPersistence());
            mqttClient.setCallback(this);
            mqttClient.connect(mqttOptions);
            logger.info("SUCCESS to connect MQTT broker({}), connector name: '{}'", mqttBrokerUri, connectorName);
            // logging
        } catch (MqttException e) {
//            throw new RuntimeException(e);
            logger.error("FAILED to connect MQTT broker({}), connector name: '{}'", mqttBrokerUri, connectorName);
            e.printStackTrace();
        }

        // mqtt subscribe
        try {
            mqttClient.subscribe(mqttTopic, 0);
            logger.info("SUCCESS to subscribe MQTT topic({}), connector name: '{}'", mqttTopic, connectorName);
        } catch (MqttException e) {
            logger.error("FAILED to subscribe MQTT topic({}), connector name: '{}'", mqttTopic, connectorName);
            e.printStackTrace();
        }
    }

    @Override
    public void start(Map<String, String> props) { // 리소스 초기화
        config = new MqttSourceConnectorConfig(props);
        connectorName = props.get("name");
        mqttTopic = config.getString("mqtt.topic");
        mqttBrokerUri = config.getString("mqtt.broker.uri");
        mqttClientId = config.getString("mqtt.client.id");
        logger.info("Starting MqttSourceConnector with connector name '{}'", connectorName);
        logger.info("MqttSourceTask config setting : " + props.toString());
        initMqttClient();
    }

    @Override
    public List<SourceRecord> poll() throws InterruptedException {
        List<SourceRecord> records = new ArrayList<>();
//        logger.debug("mqttRecordQueue status (before put): {}", mqttRecordQueue);
//        System.out.println("mqttRecordQueue status (before put): " + mqttRecordQueue);
        records.add(mqttRecordQueue.take());
//        System.out.println("mqttRecordQueue status (after put): " + mqttRecordQueue);
//        logger.debug("mqttRecordQueue status (after put): {}", mqttRecordQueue);
        return records;
    }

    @Override
    public void stop() {

    }

    @Override
    public void connectionLost(Throwable cause) {
        // log
        logger.error("Connection for connector: '{}', running client: '{}', lost to topic: '{}'.", connectorName, mqttClientId, mqttTopic);
//        System.out.printf("Connection for connector: '%s', running client: '%s', lost to topic: '%s'.\n", connectorName, mqttClientId, mqttTopic);
    }

    @Override
    public void messageArrived(String topic, MqttMessage message) throws Exception {
        logger.debug("Mqtt message arrived to connector: '{}', running client: '{}', on topic: '{}'.", connectorName, mqttClientId, mqttTopic);
        try {
            logger.debug("Mqtt message payload in byte array: '{}'", message.getPayload());
            JSONObject kafka_key = new JSONObject();
            kafka_key.put("sensor_id", config.getString("sensor.id"));
            String strkafkaKey = String.valueOf(kafka_key);

            JSONObject jsonRecordObject = new JSONObject(message.toString());
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
                valueObjectMessage.put("data", message);
                valueObjectMessage.put("location", new JSONObject());
            }

            now = Instant.now();
            valueObjectMessage.put("digital_twin_id", config.getString("digital.twin.id"));
            valueObjectMessage.put("sensor_id", config.getString("sensor.id"));
            valueObjectMessage.put("rowtime", now.atZone(ZoneOffset.UTC).format(formatter));

            mqttRecordQueue.put(dataConvert(topic, valueObjectMessage, strkafkaKey));
        } catch (Exception e) {
            logger.error("ERROR: Not able to create source record from mqtt message '{}' arrived on topic '{}' for client '{}'.", message.toString(), mqttTopic, mqttClientId);
            logger.error(String.valueOf(e));
        }
    }

    protected SourceRecord dataConvert(String topic, Object mqttMessage, String strkafkaKey) {

        ConnectHeaders headers = new ConnectHeaders();

        SourceRecord sourceRecord = new SourceRecord(
                new HashMap<>(),
                new HashMap<>(),  // java.util.Map<java.lang.String,?> sourceOffset,
                config.getString("kafka.topic"),  // java.lang.String topic
                (Integer) null,  // java.lang.Integer partition
                Schema.STRING_SCHEMA,  // Schema keySchema
                strkafkaKey,  // java.lang.Object key
                Schema.STRING_SCHEMA,  // Schema valueSchema
                mqttMessage,  // java.lang.Object value
                System.currentTimeMillis(),  // java.lang.Long timestamp
                headers  // java.lang.Iterable<Header> headers
        );

        logger.debug("Converted MQTT Message : " + sourceRecord);
        return sourceRecord;
    }


    @Override
    public void deliveryComplete(IMqttDeliveryToken token) {

    }
}
