package org.kafka.connect.http;

import com.jayway.jsonpath.JsonPath;
import org.apache.kafka.clients.consumer.OffsetAndMetadata;
import org.apache.kafka.clients.producer.KafkaProducer;
import org.apache.kafka.clients.producer.ProducerRecord;
import org.apache.kafka.common.TopicPartition;
import org.apache.kafka.connect.sink.SinkRecord;
import org.apache.kafka.connect.sink.SinkTask;
import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.ws.rs.core.Response;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.OutputStreamWriter;
import java.net.HttpURLConnection;
import java.net.MalformedURLException;
import java.net.URL;
import java.sql.*;
import java.time.Instant;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.*;

public class HttpSinkSimulationSlideStepTask extends SinkTask {
    private final Logger logger = LoggerFactory.getLogger(HttpSinkSimulationSlideStepConnector.class);
    HttpSinkSimulationSlideStepConnectorConfig config;
    URL url;
    HttpURLConnection conn;
    String connectorName;
    JSONObject responseResultObject = new JSONObject();
    JSONObject emptyJsonObject = new JSONObject();
    Integer time_step;
    Integer slide_step;
    String resource_type;
    Boolean include_input;
    String key_field;
    String key_topic;
    String postgresUrl;
    String user;
    String password;
    Connection connection;
    ArrayList<JSONObject> input_data_list = new ArrayList<JSONObject>();
    List<String> attributes;
    Instant trigger_time;
    Instant result_time;
    private KafkaProducer<String, String> producer;

    @Override
    public String version() {
        return "1.0";
    }

    @Override
    public void start(Map<String, String> props) {
        config = new HttpSinkSimulationSlideStepConnectorConfig(props);
        connectorName = props.get("name");
        time_step = config.getInt("time.step");
        slide_step = config.getInt("slide.step");
        resource_type = config.getString("resource.type");
        include_input = config.getBoolean("include.input");
        key_field = config.getString("key.field");
        key_topic = config.getString("key.topic");
        postgresUrl = config.getString("postgres.url");
        user = config.getString("postgres.user");
        password = config.getString("postgres.password");
        attributes = config.getList("simulation.attribute");
        try {
            connection = DriverManager.getConnection(postgresUrl, user, password);
            url = new URL(config.getString("http.api.url"));

        } catch (MalformedURLException | SQLException e) {
            throw new RuntimeException(e);
        }

        logger.info("Starting HttpSinkSimulationSlideStepConnector with connector name '{}'", connectorName);
        logger.info("HttpSinkSimulationSlideStepTask config setting : " + props.toString());
        // Kafka Producer 구성 설정
        Properties propsp = new Properties();
        propsp.put("bootstrap.servers", config.getString("kafka.api.url")); // Kafka Broker의 주소와 포트 지정
        propsp.put("key.serializer", "org.apache.kafka.common.serialization.StringSerializer"); // 메시지 키의 직렬화 방식 지정
        propsp.put("value.serializer", "org.apache.kafka.common.serialization.StringSerializer"); // 메시지 값의 직렬화 방식 지정
        // Kafka Producer 생성
        producer = new KafkaProducer<>(propsp);
        try {
            getInitDataFromPostgresReverse();
        } catch (IOException e) {
            throw new RuntimeException(e);
        }

    }

    @Override
    public void put(Collection<SinkRecord> records) { // record 를 가져와서 데이터 처리

        // topic 에서 polling 되어 처리가 되어야 하는 다수의 레코드
        if (records.isEmpty()) {
            return;
        }

        try {
            switch (resource_type) {
                case "digital_object":
                    //System.out.println("resource type: digital_object");
                    sendDOpostRequest(records);
                    break;
                case "simulation":
                    //System.out.println("resource type: simulation");
                    break;
                default:
                    //System.out.println("resource type: not case");
                    //sendPostRequest(records);
                    break;
            }

        } catch (Exception e) {
            throw new RuntimeException(e);
        }

    }

    private void getInitDataFromPostgresReverse() throws IOException {
        try {
            System.out.println("@@@@@@@@@@@@@@@@@@@@@@@@@@@@ getInitDataFromPostgres");
            String query = "SELECT * FROM digital_object_data where digital_object_id='" + key_topic + "' order by rowtime desc limit " + time_step;
            logger.info("query: " + query);
            PreparedStatement preparedStatement = connection.prepareStatement(query);

            ResultSet resultSet = preparedStatement.executeQuery();
            logger.info("resultSet: " + resultSet);
            JSONObject input_data_data_obj = new JSONObject();

            List<JSONObject> rows = new ArrayList<>();
            while (resultSet.next()) {
                JSONObject row = new JSONObject();
                row.put("data", resultSet.getString("data"));
                row.put("rowtime", resultSet.getString("rowtime"));
                rows.add(row);
            }

            // Process rows in reverse using a for loop
            for (int i = rows.size() - 1; i >= 0; i--) {
                JSONObject row = rows.get(i);
                String data = row.getString("data");
                String rowtime = row.getString("rowtime");
//                System.out.println("Sensor data: " + data);
//                System.out.println("Sensor rowtime: " + rowtime);

                JSONObject jsonData = new JSONObject(data);
                ArrayList<String> sensor_id_list = new ArrayList<String>();
                ArrayList<JSONObject> data_list = new ArrayList<JSONObject>();
                for (String key : jsonData.keySet()) {
                    sensor_id_list.add(key);

                    if (attributes.size() > 0) {
                        for (String attribute : attributes) {
                            input_data_data_obj.put(attribute, JsonPath.read(jsonData.get(key).toString(), "$." + attribute).toString());
                        }
                        data_list.add(input_data_data_obj);
                    } else {
                        try {
                            JSONObject sensor_data = new JSONObject(jsonData.get(key).toString());
                            data_list.add(sensor_data);
                        } catch (Exception e) {
                            JSONObject new_sensor_data = new JSONObject();
                            new_sensor_data.put(key, jsonData.get(key).toString());
                            data_list.add(new_sensor_data);
                        }
                    }
                }

                JSONObject input_data_obj = new JSONObject();
                input_data_obj.put("sensor_id", sensor_id_list);
                input_data_obj.put("data", data_list);
                input_data_obj.put("rowtime", rowtime);
                input_data_list.add(input_data_obj);

                if (input_data_list.size() == time_step) {
                    UUID uuid = UUID.randomUUID();
                    String uuidStr = "S" + uuid.toString().replace("-", "");

                    StringBuilder builder = new StringBuilder();
                    JSONObject jsonObject = new JSONObject();
                    jsonObject.put("digital_twin_id", config.getString("digital.twin.id"));
                    jsonObject.put("simulation_id", config.getString("simulation.id"));
                    jsonObject.put("simulation_name", config.getString("simulation.name"));
                    jsonObject.put("simulation_attribute", config.getList("simulation.attribute"));
                    jsonObject.put("time_step", time_step);
                    jsonObject.put("simulation_subject", key_topic);
                    jsonObject.put("simulation_data_id", uuidStr);
                    jsonObject.put("input_data", input_data_list);
                    builder.append(jsonObject);

                    conn = (HttpURLConnection) url.openConnection();
                    conn.setRequestMethod("POST");
                    conn.setRequestProperty("Content-Type", "application/json");
                    conn.setRequestProperty("Accept-Encoding", "application/json");
                    conn.setDoOutput(true); // 서버에서 온 데이터를 출력할 수 있는 상태인지
                    OutputStreamWriter writer = new OutputStreamWriter(conn.getOutputStream(), "UTF-8");
                    writer.write(builder.toString());
                    writer.close();
                    trigger_time = Instant.now();
                    // get Response
                    int status = conn.getResponseCode();
                    if (Response.Status.Family.familyOf(status) != Response.Status.Family.SUCCESSFUL) {
                        BufferedReader reader = new BufferedReader(new InputStreamReader(conn.getErrorStream()));
                        String inputLine;
                        StringBuffer error = new StringBuffer();
                        while ((inputLine = reader.readLine()) != null) {
                            error.append(inputLine);
                        }
                        reader.close();
                    } else {
                        String line;
                        BufferedReader reader = new BufferedReader(new InputStreamReader(conn.getInputStream()));
                        JSONObject content_obj = new JSONObject();
                        while ((line = reader.readLine()) != null) {
                            try {
                                content_obj = new JSONObject(line);
                            } catch (Exception e) {
                                // TODO: handle exception
                                logger.warn("(Postgres json exception catch) line: " + line);
                            }
                        }
                        reader.close();
                        // UTC 시간 출력

                        result_time = Instant.now();
                        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss.SSS");

                        responseResultObject.put("simulation_data_id", uuidStr);
                        responseResultObject.put("simulation_id", config.getString("simulation.id"));
                        responseResultObject.put("trigger_time", trigger_time.atZone(ZoneOffset.UTC).format(formatter));
                        responseResultObject.put("result_time", result_time.atZone(ZoneOffset.UTC).format(formatter));
                        responseResultObject.put("result_data", content_obj.toString());
                        if (include_input) { //input option true
                            responseResultObject.put("input_data", jsonObject.toString());
                            producer.send(new ProducerRecord<String, String>(config.getString("response.topic"), responseResultObject.toString()));
                        } else {
                            responseResultObject.put("input_data", emptyJsonObject.toString());
                            producer.send(new ProducerRecord<String, String>(config.getString("response.topic"), responseResultObject.toString()));
                        }
                    }
                    conn.disconnect();
                }
            }

            resultSet.close();
            preparedStatement.close();
            connection.close();
        } catch (SQLException e) {
            e.printStackTrace();
        }

    }


    private void sendDOpostRequest(final Collection<SinkRecord> records) throws IOException {

        for (SinkRecord record : records) {
            if (record == null) {
                continue;
            }
            if (record.value() == null) {
                continue;
            }

            String digitalObjectId = JsonPath.read(record.value().toString(), "$." + key_field);

            JSONObject input_data_data_obj = new JSONObject();
            if (digitalObjectId.equals(key_topic)) {
                try {
                    JSONObject jsonRecordObject = new JSONObject(record.value().toString());
                    String data = jsonRecordObject.getString("data");
                    JSONObject jsonData = new JSONObject(data);
                    ArrayList<String> sensor_id_list = new ArrayList<String>();
                    ArrayList<JSONObject> data_list = new ArrayList<JSONObject>();
                    for (String key : jsonData.keySet()) {
                        sensor_id_list.add(key);

                        if (attributes.size() > 0) {
                            for (String attribute : attributes) {
                                input_data_data_obj.put(attribute, JsonPath.read(jsonData.get(key).toString(), "$." + attribute).toString());
                            }
                            data_list.add(input_data_data_obj);
                        } else {
                            try {
                                JSONObject sensor_data = new JSONObject(jsonData.get(key).toString());
                                data_list.add(sensor_data);
                            } catch (Exception e) {
                                JSONObject new_sensor_data = new JSONObject();
                                new_sensor_data.put(key, jsonData.get(key).toString());
                                data_list.add(new_sensor_data);
                            }
                        }
                    }

                    JSONObject input_data_obj = new JSONObject();
                    input_data_obj.put("sensor_id", sensor_id_list);
                    input_data_obj.put("data", data_list);
                    input_data_obj.put("rowtime", jsonRecordObject.getString("rowtime"));
                    input_data_list.add(input_data_obj);

                    if (input_data_list.size() >= time_step + 1) {
                        input_data_list = new ArrayList<JSONObject>(input_data_list.subList(slide_step, time_step + slide_step));

                        UUID uuid = UUID.randomUUID();
                        String uuidStr = "S" + uuid.toString().replace("-", "");

                        StringBuilder builder = new StringBuilder();
                        JSONObject jsonObject = new JSONObject();
                        jsonObject.put("digital_twin_id", config.getString("digital.twin.id"));
                        jsonObject.put("simulation_id", config.getString("simulation.id"));
                        jsonObject.put("simulation_name", config.getString("simulation.name"));
                        jsonObject.put("simulation_attribute", config.getList("simulation.attribute"));
                        jsonObject.put("time_step", time_step);
                        jsonObject.put("simulation_subject", key_topic);
                        jsonObject.put("simulation_data_id", uuidStr);
                        jsonObject.put("input_data", input_data_list);
                        builder.append(jsonObject);
                        conn = (HttpURLConnection) url.openConnection();
                        conn.setRequestMethod("POST");
                        conn.setRequestProperty("Content-Type", "application/json");
                        conn.setRequestProperty("Accept-Encoding", "application/json");
                        conn.setDoOutput(true); // 서버에서 온 데이터를 출력할 수 있는 상태인지
                        OutputStreamWriter writer = new OutputStreamWriter(conn.getOutputStream(), "UTF-8");
                        writer.write(builder.toString());
                        writer.close();

                        trigger_time = Instant.now();
                        // get Response
                        int status = conn.getResponseCode();
                        if (Response.Status.Family.familyOf(status) != Response.Status.Family.SUCCESSFUL) {
                            BufferedReader reader = new BufferedReader(new InputStreamReader(conn.getErrorStream()));
                            String inputLine;
                            StringBuffer error = new StringBuffer();
                            while ((inputLine = reader.readLine()) != null) {
                                error.append(inputLine);
                            }
                            reader.close();
                        } else {
                            String line;
                            BufferedReader reader = new BufferedReader(new InputStreamReader(conn.getInputStream()));
                            JSONObject content_obj = new JSONObject();
                            while ((line = reader.readLine()) != null) {
                                try {
                                    logger.info("(sendDOpostRequest try) line: " + line);
                                    content_obj = new JSONObject(line);
                                } catch (Exception e) {
                                    // TODO: handle exception
                                    logger.warn("(sendDOpostRequest json exception catch) line: " + line);
                                }
                            }
                            reader.close();
                            // UTC 시간 출력
                            result_time = Instant.now();
                            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss.SSS");

                            responseResultObject.put("simulation_data_id", uuidStr);
                            responseResultObject.put("simulation_id", config.getString("simulation.id"));
                            responseResultObject.put("trigger_time", trigger_time.atZone(ZoneOffset.UTC).format(formatter));
                            responseResultObject.put("result_time", result_time.atZone(ZoneOffset.UTC).format(formatter));
                            responseResultObject.put("result_data", content_obj.toString());
                            if (include_input) { //input option true
                                responseResultObject.put("input_data", jsonObject.toString());
                                producer.send(new ProducerRecord<String, String>(config.getString("response.topic"), responseResultObject.toString()));
                            } else {
                                responseResultObject.put("input_data", emptyJsonObject.toString());
                                producer.send(new ProducerRecord<String, String>(config.getString("response.topic"), responseResultObject.toString()));
                            }
                        }
                        conn.disconnect();
                    }
                } catch (Exception e) {
                    System.out.println("Try-catch ParseException e : " + e);
                    continue;
                }
            }
        }
    }


    private void sendPostRequest(final Collection<SinkRecord> records) throws IOException {
        conn = (HttpURLConnection) url.openConnection();
        conn.setRequestMethod("POST");
        conn.setRequestProperty("Content-Type", "application/json");
        conn.setRequestProperty("Accept-Encoding", "application/json");
        conn.setDoOutput(true); // 서버에서 온 데이터를 출력할 수 있는 상태인지

        // send POST Request
        StringBuilder builder = new StringBuilder();
        JSONObject jsonObject = new JSONObject();
        ArrayList<JSONObject> input_data_list = new ArrayList<JSONObject>();
        JSONObject input_data_obj = new JSONObject();
        JSONObject input_data_data_obj = new JSONObject();
        ArrayList<String> sensor_id_list = new ArrayList<String>();
        ArrayList<JSONObject> data_list = new ArrayList<JSONObject>();

        List<String> attributes = config.getList("simulation.attribute");
        for (SinkRecord record : records) {
            if (record == null) {
                continue;
            }
            if (record.value() == null) {
                continue;
            }

            try {
                JSONObject jsonRecordObject = new JSONObject(record.value().toString());
                String data = jsonRecordObject.getString("data");
                JSONObject jsonData = new JSONObject(data);
                for (String key : jsonData.keySet()) {
                    sensor_id_list.add(key);
                    JSONObject sensor_data = new JSONObject(jsonData.get(key).toString());
                    for (String attribute : attributes) {
//                        System.out.println(attribute + " : " + sensor_data.get(attribute).toString());
                        input_data_data_obj.put(attribute, sensor_data.get(attribute).toString());
//                        System.out.println("input_data_data_obj : " + input_data_data_obj);
                    }
                    data_list.add(input_data_data_obj);
                    input_data_data_obj = new JSONObject();
                }
                input_data_obj.put("sensor_id", sensor_id_list);
                input_data_obj.put("data", data_list);
                input_data_obj.put("rowtime", jsonRecordObject.getString("rowtime"));
                input_data_list.add(input_data_obj);

            } catch (Exception e) {
                System.out.println("Try-catch ParseException e" + e);
                continue;
            }

            UUID uuid = UUID.randomUUID();
            String uuidStr = "S" + uuid.toString().replace("-", "");

            String recordTopic = record.topic();
            jsonObject.put("digital_twin_id", config.getString("digital.twin.id"));
            jsonObject.put("simulation_id", config.getString("simulation.id"));
            jsonObject.put("simulation_name", config.getString("simulation.name"));
            jsonObject.put("simulation_attribute", config.getList("simulation.attribute"));
            jsonObject.put("time_step", time_step);
            jsonObject.put("simulation_subject", recordTopic);
            jsonObject.put("simulation_data_id", uuidStr);
            jsonObject.put("input_data", input_data_list);
            builder.append(jsonObject);

        }

        OutputStreamWriter writer = new OutputStreamWriter(conn.getOutputStream(), "UTF-8");
        writer.write(builder.toString());
        writer.close();

        // get Response
        int status = conn.getResponseCode();
        if (Response.Status.Family.familyOf(status) != Response.Status.Family.SUCCESSFUL) {
            BufferedReader in = new BufferedReader(new InputStreamReader(conn.getErrorStream()));
            String inputLine;
            StringBuffer error = new StringBuffer();
            while ((inputLine = in.readLine()) != null) {
                error.append(inputLine);
            }
            in.close();
        } else {
            BufferedReader in = new BufferedReader(new InputStreamReader(conn.getInputStream()));
            String inputLine;
            StringBuffer content = new StringBuffer();
            while ((inputLine = in.readLine()) != null) {
                content.append(inputLine);
            }

            //responseResultObject.put("input", finalBucket.toString());
            responseResultObject.put("timestamp", "lastTimeStamp");
            responseResultObject.put("input", jsonObject);
            responseResultObject.put("result", content);
            producer.send(new ProducerRecord<String, String>(config.getString("response.topic"), responseResultObject.toString()));
            in.close();
        }
        conn.disconnect();
    }


    @Override
    public void flush(Map<TopicPartition, OffsetAndMetadata> currentOffsets) { // 어디까지 데이터가 처리되었는지에 대한 정보를 받아서 commit 시점마다 어느 offset 까지 처리했는지 확인할 수 있음
//        super.flush(currentOffsets);
        //ignored
    }


    @Override
    public void stop() { // 리소스 해제
        logger.info("Stopping HttpSinkSimulationSlideStepConnector task");
    }
}
