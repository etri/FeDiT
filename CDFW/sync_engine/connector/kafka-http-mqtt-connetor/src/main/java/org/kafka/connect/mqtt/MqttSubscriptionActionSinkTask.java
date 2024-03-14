package org.kafka.connect.mqtt;

import com.jayway.jsonpath.JsonPath;
import org.apache.kafka.clients.consumer.OffsetAndMetadata;
import org.apache.kafka.common.TopicPartition;
import org.apache.kafka.connect.sink.SinkRecord;
import org.apache.kafka.connect.sink.SinkTask;
import org.eclipse.paho.client.mqttv3.*;
import org.eclipse.paho.client.mqttv3.persist.MemoryPersistence;
import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.*;

public class MqttSubscriptionActionSinkTask extends SinkTask implements MqttCallback {

    private final Logger logger = LoggerFactory.getLogger(MqttSubscriptionActionSinkConnector.class);
    MqttSubscriptionActionSinkConnectorConfig config;
    String key_topic;
    String resource_type;
    private String connectorName;
    private String mqttTopic;
    private String mqttClientId;
    private String mqttBrokerUri;
    private MqttClient mqttClient;
    private MqttConnectOptions mqttOptions;
    private List filtering_condition;
    private List filtering_action;

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
            logger.info("[MqttSubscriptionActionSinkTask] SUCCESS to connect MQTT broker({}), connector name: '{}'", mqttBrokerUri, connectorName);
            // logging
        } catch (MqttException e) {
            e.printStackTrace();
        }

        // mqtt subscribe
        try {
            mqttClient.subscribe(mqttTopic, 0);
            logger.info("[MqttSubscriptionActionSinkTask] SUCCESS to subscribe MQTT topic({}), connector name: '{}'", mqttTopic, connectorName);
        } catch (MqttException e) {
            e.printStackTrace();
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
        if (records.isEmpty()) {
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

    private boolean isFilteringListMatch(String value, String condition) {
//        logger.info("@@@ isFilteringListMatch value: " + value);
//        logger.info("@@@ isFilteringListMatch condition: " + condition);
//
//        logger.info("JsonPath: " + JsonPath.read(value, condition).toString());
//        logger.info("JsonPath-result: " + !JsonPath.read(value, condition).toString().equals("[]"));
        return !JsonPath.read(value, condition).toString().equals("[]");
    }

    private void getMatchingAction(String value, String record_value) throws MqttException {
        ArrayList<List> filtering_condition_lists = new ArrayList<List>(Arrays.asList(filtering_condition));
        ArrayList<List> filtering_action_lists = new ArrayList<List>(Arrays.asList(filtering_action));
        List filtering_condition_list = filtering_condition_lists.get(0);
        List filtering_action_list = filtering_action_lists.get(0);

        if (filtering_condition_list.size() != filtering_action_list.size()) {
//            logger.info("filtering_condition_list.size() != filtering_action_list.size()");
        }
//        logger.info("### getMatchingAction");
//        logger.info("filtering_action : " + filtering_condition_list);
//        logger.info("filtering_condition : " + filtering_action_list);
        for (int i = 0; i < filtering_condition_list.size(); i++) {
            String condition = filtering_condition_list.get(i).toString();
            String action = filtering_action_list.get(i).toString();
//            logger.info("[action] : " + filtering_condition_list);
//            logger.info("[condition] : " + action);
            if (isFilteringListMatch(value, condition)) {
//                logger.info("isFilteringListMatch: if");
                // If the condition is satisfied
                JSONObject jsonObject = new JSONObject(record_value);
                jsonObject.put("actionFunc", action);
                sendMqttMessage(jsonObject.toString());
            } else {
                JSONObject jsonObject = new JSONObject(record_value);
                sendMqttMessage(jsonObject.toString());
            }
        }
    }

    private void sendMqttMessage(String value) throws MqttException {
        try {
            MqttMessage message = new MqttMessage();
            message.setPayload(value.getBytes());
            if (mqttClient.isConnected()) {
                mqttClient.publish(mqttTopic, message);
            } else {
                mqttClient.reconnect();
                mqttClient.publish(mqttTopic, message);
            }
        } catch (MqttException e) {
            logger.info(String.valueOf(e));
        }
    }

    private void tryExecute(final Collection<SinkRecord> records) throws MqttException {
        for (SinkRecord record : records) {
            if (record == null || record.value() == null) {
                continue;
            }
            String record_topic = record.topic();
            String record_value = record.value().toString();
            if (record_topic.equals("latestDigitalObjects")) {
                try {
                    String digital_Id = JsonPath.read(record.value().toString(), "$.digital_object_id");
                    String[] key_topicArray = key_topic.toString().split(",");
                    for (String topic : key_topicArray) {
                        if (digital_Id.equals(topic)) {
                            if (!filtering_condition.get(0).equals("default")) {
                                JSONObject jsonRecordObject = new JSONObject(record_value);
//                                logger.info("jsonRecordObject: " + jsonRecordObject);
                                String data = jsonRecordObject.getString("data");
//                                logger.info("data: " + data);
                                JSONObject jsonRecordData = new JSONObject(data);
//                                logger.info("jsonRecordData: " + jsonRecordData);
                                getMatchingAction(jsonRecordData.toString(), record_value);
                            } else {
//                                logger.info("### [else] filtering_condition.get(0).equals(\"default\")");
                                sendMqttMessage(record_value);
                            }
                        }
                    }
                } catch (Exception e) {
//                    logger.info("### [tryExecute - catch]");
//                    logger.info(String.valueOf(e));
                }
            } else {
//                logger.info("### [else] record_topic.equals(\"latestDigitalObjects\")");
                sendMqttMessage(record.value().toString());
            }
        }
    }

    private void tryFDOExecute(final Collection<SinkRecord> records) throws MqttException {
        for (SinkRecord record : records) {
            if (record == null || record.value() == null) {
                continue;
            }
            String record_topic = record.topic();
            String value = record.value().toString();
            if (record_topic.equals("latestFederatedDigitalObjects")) {
                try {
                    String digital_Id = JsonPath.read(record.value().toString(), "$.federated_digital_object_id");
                    String[] key_topicArray = key_topic.toString().split(",");
                    for (String topic : key_topicArray) {
                        if (digital_Id.equals(topic)) {
                            sendMqttMessage(value);
                        }
                    }
                } catch (Exception e) {
                    logger.info(String.valueOf(e));
                    sendMqttMessage(value);
                }
            } else {
                sendMqttMessage(value);
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
