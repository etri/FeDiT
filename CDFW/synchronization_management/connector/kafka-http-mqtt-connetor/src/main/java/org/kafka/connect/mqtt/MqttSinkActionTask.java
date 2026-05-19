package org.kafka.connect.mqtt;

import com.jayway.jsonpath.JsonPath;
import org.apache.kafka.clients.consumer.OffsetAndMetadata;
import org.apache.kafka.common.TopicPartition;
import org.apache.kafka.connect.sink.SinkRecord;
import org.apache.kafka.connect.sink.SinkTask;
import org.eclipse.paho.client.mqttv3.*;
import org.eclipse.paho.client.mqttv3.persist.MemoryPersistence;
import org.kafka.connect.util.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.*;


public class MqttSinkActionTask extends SinkTask implements MqttCallback {
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
        config = new MqttSinkActionConnectorConfig(props);
        connectorName = props.get("name");
        mqttTopic = config.getString("mqtt.topic");
        mqttBrokerUri = config.getString("mqtt.broker.uri");
        mqttClientId = config.getString("mqtt.client.id");
        filtering_action = config.getList("filtering.action.list");
        filtering_condition = config.getList("filtering.condition.list");
        key_topic = config.getString("key.topic");
        resource_type = config.getString("resource.type");

        initMqttClient();

    }

    @Override
    public void put(Collection<SinkRecord> records) {
        for (SinkRecord record : records) {
            if (record.value() != null) {
                try {
                    String value = record.value().toString();
                    if (!filtering_condition.isEmpty()) {
                        getMatchingAction(value);
                    } else {
                        logger.info("@@@ filtering_condition.isEmpty()");
                        logger.info("filtering_action : " + filtering_action);
                        logger.info("filtering_condition : " + filtering_condition);
                    }
                } catch (Exception e) {
                    throw new RuntimeException(e);
                }
            }
        }

    }

    private boolean isFilteringListMatch(String value, String condition) {
        return !JsonPath.read(value, condition).toString().equals("[]");
    }

    private void getMatchingAction(String value) throws MqttException {
        ArrayList<List> filtering_condition_lists = new ArrayList<List>(Arrays.asList(filtering_condition));
        ArrayList<List> filtering_action_lists = new ArrayList<List>(Arrays.asList(filtering_action));
        List filtering_condition_list = filtering_condition_lists.get(0);
        List filtering_action_list = filtering_action_lists.get(0);

        if (filtering_condition_list.size() != filtering_action_list.size()) {
            logger.info("filtering_condition_list.size() != filtering_action_list.size()");
        }

        for (int i = 0; i < filtering_condition_list.size(); i++) {
            String condition = filtering_condition_list.get(i).toString();
            String action = filtering_action_list.get(i).toString();
            if (isFilteringListMatch(value, condition)) {
                // If the condition is satisfied
                JSONObject jsonObject = new JSONObject();
                jsonObject.put("digital_object_id", config.getString("digital.object.id"));
                jsonObject.put("actionFunc", action);
                jsonObject.put("digital_twin_data", value);
                sendMqttMessage(jsonObject.toString());
            }
        }
    }

    private void sendMqttMessage(String value) throws MqttException {
        MqttMessage message = new MqttMessage();
        message.setPayload(value.getBytes());
        if (mqttClient.isConnected()) {
            mqttClient.publish(mqttTopic, message);
        }

    }

    @Override
    public void flush(Map<TopicPartition, OffsetAndMetadata> currentOffsets) { // 어디까지 데이터가 처리되었는지에 대한 정보를 받아서 commit 시점마다 어느 offset 까지 처리했는지 확인할 수 있음
//        super.flush(currentOffsets);
        //ignored
    }

    @Override
    public void stop() {
        logger.info("Stopping MqttSinkActionConnector task");
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
