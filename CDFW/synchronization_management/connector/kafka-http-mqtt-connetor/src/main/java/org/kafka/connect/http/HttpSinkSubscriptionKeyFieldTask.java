package org.kafka.connect.http;

import com.jayway.jsonpath.JsonPath;
import org.apache.kafka.clients.consumer.OffsetAndMetadata;
import org.apache.kafka.common.TopicPartition;
import org.apache.kafka.connect.sink.SinkRecord;
import org.apache.kafka.connect.sink.SinkTask;
import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.OutputStreamWriter;
import java.net.HttpURLConnection;
import java.net.MalformedURLException;
import java.net.URL;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Map;

public class HttpSinkSubscriptionKeyFieldTask extends SinkTask {

    private final Logger logger = LoggerFactory.getLogger(HttpSinkSubscriptionKeyFieldConnector.class);
    URL url;
    HttpURLConnection conn;
    BufferedReader br;
    HttpSinkSubscriptionKeyFieldConnectorConfig config;
    ArrayList<URL> URI_list = new ArrayList<URL>();
    String key_topic;
    String resource_type;
    private String connectorName;

    @Override
    public String version() {
        return "1.0";
    }

    @Override
    public void start(Map<String, String> props) {
        config = new HttpSinkSubscriptionKeyFieldConnectorConfig(props);
        key_topic = config.getString("key.topic");
        resource_type = config.getString("resource.type");
        connectorName = props.get("name");
        try {
            List<String> http_api_url = config.getList("http.api.url");
            for (String httl_url : http_api_url) {
                URI_list.add(new URL(httl_url));
                System.out.println("Check HTTP GET URL : " + httl_url);
            }
        } catch (MalformedURLException e) {
            throw new RuntimeException(e);
        }

        logger.info("Starting HttpSinkSubscriptionKeyFieldConnector with connector name '{}'", connectorName);
        logger.info("HttpSinkSubscriptionKeyFieldTask config setting : " + props.toString());
    }

    @Override
    public void put(Collection<SinkRecord> records) { // record 를 가져와서 데이터 처리
        // topic 에서 polling 되어 처리가 되어야 하는 다수의 레코드
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

        } catch (Exception e) {
            throw new RuntimeException(e);
        }

    }

    private void tryExecute(final Collection<SinkRecord> records) throws IOException {
        for (URL uri : URI_list) {
            JSONObject jsonObject = new JSONObject();
            for (SinkRecord record : records) {
                if (record == null || record.value() == null) {
                    continue;
                }
                String record_topic = record.topic();
                String recordValue = record.value().toString();
                if (record_topic.equals("latestDigitalObjects")) {
                    try {
                        String digital_Id = JsonPath.read(recordValue, "$.digital_object_id");
                        String[] key_topicArray = key_topic.toString().split(",");
                        for (String topic : key_topicArray) {
                            if (digital_Id.equals(topic)) {
//                                System.out.println("Matching value found: " + digital_Id);
                                jsonObject.put("digital_twin_id", config.getString("digital.twin.id"));
                                jsonObject.put("subscription_id", config.getString("subscription.id"));
                                jsonObject.put("subscription_name", config.getString("subscription.name"));
                                jsonObject.put("data", recordValue);

                                StringBuilder builder = new StringBuilder();
                                builder.append(record.value());

                                conn = (HttpURLConnection) uri.openConnection();
                                conn.setRequestMethod("POST");
                                conn.setRequestProperty("Content-Type", "application/json");
                                conn.setRequestProperty("Accept-Encoding", "application/json");
                                conn.setDoOutput(true);
                                OutputStreamWriter writer = new OutputStreamWriter(conn.getOutputStream(), "UTF-8");
                                writer.write(builder.toString());
                                writer.close();

                                // get Response
                                int status = conn.getResponseCode();
                                //System.out.println("RESPONSE CODE : " + status + "\nresponse message: " + conn.getResponseMessage());

                                conn.disconnect();
                            }
                        }

                    } catch (Exception e) {
                        logger.error("sendPostRequest] Try-catch Exception e : " + e);
                    }
                } else {
                    try {
                        jsonObject.put("digital_twin_id", config.getString("digital.twin.id"));
                        jsonObject.put("subscription_id", config.getString("subscription.id"));
                        jsonObject.put("subscription_name", config.getString("subscription.name"));
                        jsonObject.put("data", recordValue);

                        StringBuilder builder = new StringBuilder();
                        builder.append(record.value());

                        conn = (HttpURLConnection) uri.openConnection();
                        conn.setRequestMethod("POST");
                        conn.setRequestProperty("Content-Type", "application/json");
                        conn.setRequestProperty("Accept-Encoding", "application/json");
                        conn.setDoOutput(true);
                        OutputStreamWriter writer = new OutputStreamWriter(conn.getOutputStream(), "UTF-8");
                        writer.write(builder.toString());
                        writer.close();

                        // get Response
                        int status = conn.getResponseCode();
                        //System.out.println("RESPONSE CODE : " + status + "\nresponse message: " + conn.getResponseMessage());

                        conn.disconnect();
                    } catch (Exception e2) {
                        logger.error("sendPostRequest] Try-catch Exception e : " + e2);
                    }
                }
            }
        }
    }

    private void tryFDOExecute(final Collection<SinkRecord> records) throws IOException {
        for (URL uri : URI_list) {
            JSONObject jsonObject = new JSONObject();
            for (SinkRecord record : records) {
                if (record == null || record.value() == null) {
                    continue;
                }
                String record_topic = record.topic();
                String recordValue = record.value().toString();
                if (record_topic.equals("latestFederatedDigitalObjects")) {
                    try {
                        String digital_Id = JsonPath.read(recordValue, "$.federated_digital_object_id");
                        String[] key_topicArray = key_topic.toString().split(",");
                        for (String topic : key_topicArray) {
                            if (digital_Id.equals(topic)) {
//                                System.out.println("Matching value found: " + digital_Id);
                                jsonObject.put("federated_digital_twin_id", config.getString("federated.digital.twin.id"));
                                jsonObject.put("subscription_id", config.getString("subscription.id"));
                                jsonObject.put("subscription_name", config.getString("subscription.name"));
                                jsonObject.put("data", recordValue);

                                StringBuilder builder = new StringBuilder();
                                builder.append(record.value());

                                conn = (HttpURLConnection) uri.openConnection();
                                conn.setRequestMethod("POST");
                                conn.setRequestProperty("Content-Type", "application/json");
                                conn.setRequestProperty("Accept-Encoding", "application/json");
                                conn.setDoOutput(true);
                                OutputStreamWriter writer = new OutputStreamWriter(conn.getOutputStream(), "UTF-8");
                                writer.write(builder.toString());
                                writer.close();

                                // get Response
                                int status = conn.getResponseCode();
                                //System.out.println("RESPONSE CODE : " + status + "\nresponse message: " + conn.getResponseMessage());

                                conn.disconnect();
                            }
                        }

                    } catch (Exception e) {
                        logger.error("sendPostRequest] Try-catch Exception e : " + e);
                    }
                } else if (record_topic.equals("UnalliedDigitalObjects")) {
                    try {
                        String digital_Id = JsonPath.read(recordValue, "$.digital_object_id");
                        String[] key_topicArray = key_topic.toString().split(",");
                        for (String topic : key_topicArray) {
                            if (digital_Id.equals(topic)) {
//                                System.out.println("Matching value found: " + digital_Id);
                                jsonObject.put("federated_digital_twin_id", config.getString("federated.digital.twin.id"));
                                jsonObject.put("subscription_id", config.getString("subscription.id"));
                                jsonObject.put("subscription_name", config.getString("subscription.name"));
                                jsonObject.put("data", recordValue);

                                StringBuilder builder = new StringBuilder();
                                builder.append(record.value());

                                conn = (HttpURLConnection) uri.openConnection();
                                conn.setRequestMethod("POST");
                                conn.setRequestProperty("Content-Type", "application/json");
                                conn.setRequestProperty("Accept-Encoding", "application/json");
                                conn.setDoOutput(true);
                                OutputStreamWriter writer = new OutputStreamWriter(conn.getOutputStream(), "UTF-8");
                                writer.write(builder.toString());
                                writer.close();

                                // get Response
                                int status = conn.getResponseCode();
                                //System.out.println("RESPONSE CODE : " + status + "\nresponse message: " + conn.getResponseMessage());

                                conn.disconnect();
                            }
                        }

                    } catch (Exception e) {
                        logger.error("sendPostRequest] Try-catch Exception e : " + e);
                    }
                } else if (record_topic.equals("fdo_control_result")) {
                    try {
                        String digital_Id = JsonPath.read(recordValue, "$.federated_digital_object_id");
                        String[] key_topicArray = key_topic.toString().split(",");
                        for (String topic : key_topicArray) {
                            if (digital_Id.equals(topic)) {
//                                System.out.println("Matching value found: " + digital_Id);
                                jsonObject.put("federated_digital_twin_id", config.getString("federated.digital.twin.id"));
                                jsonObject.put("subscription_id", config.getString("subscription.id"));
                                jsonObject.put("subscription_name", config.getString("subscription.name"));
                                jsonObject.put("data", recordValue);

                                StringBuilder builder = new StringBuilder();
                                builder.append(record.value());

                                conn = (HttpURLConnection) uri.openConnection();
                                conn.setRequestMethod("POST");
                                conn.setRequestProperty("Content-Type", "application/json");
                                conn.setRequestProperty("Accept-Encoding", "application/json");
                                conn.setDoOutput(true);
                                OutputStreamWriter writer = new OutputStreamWriter(conn.getOutputStream(), "UTF-8");
                                writer.write(builder.toString());
                                writer.close();

                                // get Response
                                int status = conn.getResponseCode();
                                //System.out.println("RESPONSE CODE : " + status + "\nresponse message: " + conn.getResponseMessage());

                                conn.disconnect();
                            }
                        }

                    } catch (Exception e) {
                        logger.error("sendPostRequest] Try-catch Exception e : " + e);
                    }
                } else if (record_topic.equals("do_control_result")) {
                    try {
                        String digital_Id = JsonPath.read(recordValue, "$.digital_object_id");
                        String[] key_topicArray = key_topic.toString().split(",");
                        for (String topic : key_topicArray) {
                            if (digital_Id.equals(topic)) {
//                                System.out.println("Matching value found: " + digital_Id);
                                jsonObject.put("federated_digital_twin_id", config.getString("federated.digital.twin.id"));
                                jsonObject.put("subscription_id", config.getString("subscription.id"));
                                jsonObject.put("subscription_name", config.getString("subscription.name"));
                                jsonObject.put("data", recordValue);

                                StringBuilder builder = new StringBuilder();
                                builder.append(record.value());

                                conn = (HttpURLConnection) uri.openConnection();
                                conn.setRequestMethod("POST");
                                conn.setRequestProperty("Content-Type", "application/json");
                                conn.setRequestProperty("Accept-Encoding", "application/json");
                                conn.setDoOutput(true);
                                OutputStreamWriter writer = new OutputStreamWriter(conn.getOutputStream(), "UTF-8");
                                writer.write(builder.toString());
                                writer.close();

                                // get Response
                                int status = conn.getResponseCode();
                                //System.out.println("RESPONSE CODE : " + status + "\nresponse message: " + conn.getResponseMessage());

                                conn.disconnect();
                            }
                        }

                    } catch (Exception e) {
                        logger.error("sendPostRequest] Try-catch Exception e : " + e);
                    }
                } else {
                    try {
                        jsonObject.put("federated_digital_twin_id", config.getString("digital.twin.id"));
                        jsonObject.put("subscription_id", config.getString("subscription.id"));
                        jsonObject.put("subscription_name", config.getString("subscription.name"));
                        jsonObject.put("data", recordValue);

                        StringBuilder builder = new StringBuilder();
                        builder.append(record.value());

                        conn = (HttpURLConnection) uri.openConnection();
                        conn.setRequestMethod("POST");
                        conn.setRequestProperty("Content-Type", "application/json");
                        conn.setRequestProperty("Accept-Encoding", "application/json");
                        conn.setDoOutput(true);
                        OutputStreamWriter writer = new OutputStreamWriter(conn.getOutputStream(), "UTF-8");
                        writer.write(builder.toString());
                        writer.close();

                        // get Response
                        int status = conn.getResponseCode();
                        //System.out.println("RESPONSE CODE : " + status + "\nresponse message: " + conn.getResponseMessage());

                        conn.disconnect();
                    } catch (Exception e2) {
                        logger.error("sendPostRequest] Try-catch Exception e : " + e2);
                    }
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
    public void stop() { // 리소스 해제
        logger.info("Stopping HttpSinkConnector task");
    }
}