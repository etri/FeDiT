package org.kafka.connect.mqtt;

import org.apache.kafka.clients.consumer.OffsetAndMetadata;
import org.apache.kafka.common.TopicPartition;
import org.apache.kafka.connect.sink.SinkRecord;
import org.apache.kafka.connect.sink.SinkTask;
import org.eclipse.paho.client.mqttv3.*;
import org.eclipse.paho.client.mqttv3.persist.MemoryPersistence;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Collection;
import java.util.Map;

public class MqttSinkTask extends SinkTask implements MqttCallback {
    private final Logger logger = LoggerFactory.getLogger(MqttSinkConnector.class);
    MqttSinkConnectorConfig config;
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
    public void start(Map<String, String> props) {
        config = new MqttSinkConnectorConfig(props);
        connectorName = props.get("name");
        mqttTopic = config.getString("mqtt.topic");
        mqttBrokerUri = config.getString("mqtt.broker.uri");
        mqttClientId = config.getString("mqtt.client.id");

        logger.info("Starting MqttSinkConnector with connector name '{}'", connectorName);
        logger.info("MqttSinkTask config setting : " + props.toString());
        initMqttClient();

    }

    @Override
    public void put(Collection<SinkRecord> records) {
        if (records.isEmpty()) {
            //System.out.println("records is empty");
            return;
        }
        try {
            sendMqttMessage(records);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    private void sendMqttMessage(final Collection<SinkRecord> records) throws MqttException {
        for (SinkRecord record : records) {
            if (record.value() == null) {
                //System.out.println("record.value() is empty");
                continue;
            }
            MqttMessage message = new MqttMessage();
            message.setPayload(record.value().toString().getBytes());
            //System.out.println("Kafka message to send (to MQTT) : "+message);
            if (mqttClient.isConnected()) {
                mqttClient.publish(mqttTopic, message);
            }
        }
    }

    @Override
    public void flush(Map<TopicPartition, OffsetAndMetadata> currentOffsets) { // 어디까지 데이터가 처리되었는지에 대한 정보를 받아서 commit 시점마다 어느 offset 까지 처리했는지 확인할 수 있음
//        super.flush(currentOffsets);
        //ignored
    }

    @Override
    public void stop() {
        logger.info("Stopping MqttSinkConnector task");
    }

    @Override
    public void connectionLost(Throwable cause) {

    }

    @Override
    public void messageArrived(String topic, MqttMessage message) throws Exception {

    }

    @Override
    public void deliveryComplete(IMqttDeliveryToken token) {

    }
}
