package org.kafka.connect.mqtt;

import com.jayway.jsonpath.JsonPath;
import org.apache.kafka.clients.consumer.OffsetAndMetadata;
import org.apache.kafka.common.TopicPartition;
import org.apache.kafka.connect.sink.SinkRecord;
import org.apache.kafka.connect.sink.SinkTask;
import org.eclipse.paho.client.mqttv3.*;
import org.eclipse.paho.client.mqttv3.persist.MemoryPersistence;

import java.util.Collection;
import java.util.Map;

public class MqttSubscriptionKeyFieldSinkTask extends SinkTask implements MqttCallback {
    MqttSubscriptionKeyFieldSinkConnectorConfig config;
    String key_topic;
    String resource_type;
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
            // logging
        } catch (MqttException e) {
            e.printStackTrace();
        }

        // mqtt subscribe
        try {
            mqttClient.subscribe(mqttTopic, 0);
        } catch (MqttException e) {
            e.printStackTrace();
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

        initMqttClient();
    }

    @Override
    public void put(Collection<SinkRecord> records) {
        if (records.isEmpty()) {
            //System.out.println("records is empty");
            return;
        }
        try {
            if ("digital_object".equals(resource_type)) {
                tryExecute(records);
            } else if ("federated_digital_object".equals(resource_type)) {
                tryFDOExecute(records);
            } else {
                System.out.println("Unsupported resource_type: " + resource_type);
            }
        } catch (MqttException e) {
            e.printStackTrace();
        }

    }

    private void tryExecute(final Collection<SinkRecord> records) throws MqttException {
        for (SinkRecord record : records) {
            if (record == null || record.value() == null) {
                continue;
            }
            String record_topic = record.topic();
            String recordValue = record.value().toString();
            if (record_topic.equals("latestDigitalObjects")) {
                try {
                    String digital_Id = JsonPath.read(record.value().toString(), "$.digital_object_id");
                    String[] key_topicArray = key_topic.toString().split(",");
                    for (String topic : key_topicArray) {
                        if (digital_Id.equals(topic)) {
                            try {
                                MqttMessage message = new MqttMessage();
                                message.setPayload(record.value().toString().getBytes());
                                if (mqttClient.isConnected()) {
                                    mqttClient.publish(mqttTopic, message);
                                } else {
                                    mqttClient.reconnect();
                                    mqttClient.publish(mqttTopic, message);
                                }
                            } catch (Exception e) {
                            }
                        }
                    }
                } catch (Exception e) {
                }
            } else {
                try {
                    MqttMessage message = new MqttMessage();
                    message.setPayload(record.value().toString().getBytes());
                    if (mqttClient.isConnected()) {
                        mqttClient.publish(mqttTopic, message);
                    } else {
                        mqttClient.reconnect();
                        mqttClient.publish(mqttTopic, message);
                    }
                } catch (Exception e2) {
                }
            }
        }
    }

    private void tryFDOExecute(final Collection<SinkRecord> records) throws MqttException {
        for (SinkRecord record : records) {
            if (record == null || record.value() == null) {
                continue;
            }
            String record_topic = record.topic();
            String recordValue = record.value().toString();
            if (record_topic.equals("latestFederatedDigitalObjects")) {
                try {
                    String digital_Id = JsonPath.read(record.value().toString(), "$.federated_digital_object_id");
                    String[] key_topicArray = key_topic.toString().split(",");
                    for (String topic : key_topicArray) {
                        if (digital_Id.equals(topic)) {
                            try {
                                MqttMessage message = new MqttMessage();
                                message.setPayload(record.value().toString().getBytes());
                                if (mqttClient.isConnected()) {
                                    mqttClient.publish(mqttTopic, message);
                                } else {
                                    mqttClient.reconnect();
                                    mqttClient.publish(mqttTopic, message);
                                }
                            } catch (Exception e) {
                            }
                        }
                    }
                } catch (Exception e) {
                }
            } else {
                try {
                    MqttMessage message = new MqttMessage();
                    message.setPayload(record.value().toString().getBytes());
                    if (mqttClient.isConnected()) {
                        mqttClient.publish(mqttTopic, message);
                    } else {
                        mqttClient.reconnect();
                        mqttClient.publish(mqttTopic, message);
                    }
                } catch (Exception e2) {
                }
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
