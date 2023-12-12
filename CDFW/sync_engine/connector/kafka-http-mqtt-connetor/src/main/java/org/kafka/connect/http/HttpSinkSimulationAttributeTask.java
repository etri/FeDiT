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
import java.time.Instant;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.*;

public class HttpSinkSimulationAttributeTask extends SinkTask {
    private final Logger logger = LoggerFactory.getLogger(HttpSinkSimulationAttributeConnector.class);
    HttpSinkSimulationAttributeConnectorConfig config;
    URL url;
    HttpURLConnection conn;
    String connectorName;
    JSONObject responseResultObject = new JSONObject();
    JSONObject emptyJsonObject = new JSONObject();
    Integer time_step;
    String resource_type;
    Boolean include_input;
    ArrayList<JSONObject> input_data_list = new ArrayList<JSONObject>();

    private KafkaProducer<String, String> producer;

    @Override
    public String version() {
        return "1.0";
    }

    @Override
    public void start(Map<String, String> props) {
        config = new HttpSinkSimulationAttributeConnectorConfig(props);
        connectorName = props.get("name");
        time_step = config.getInt("time.step");
        resource_type = config.getString("resource.type");
        include_input = config.getBoolean("include.input");

        try {
            url = new URL(config.getString("http.api.url"));
            System.out.println("Check HTTP GET URL : " + config.getString("http.api.url"));
        } catch (MalformedURLException e) {
            throw new RuntimeException(e);
        }

        logger.info("Starting HttpSinkSimulationAttributeConnector with connector name '{}'", connectorName);
        logger.info("HttpSinkSimulationAttributeTask config setting : " + props.toString());

        // Kafka Producer 구성 설정
        Properties propsp = new Properties();
        propsp.put("bootstrap.servers", config.getString("kafka.api.url")); // Kafka Broker의 주소와 포트 지정
        propsp.put("key.serializer", "org.apache.kafka.common.serialization.StringSerializer"); // 메시지 키의 직렬화 방식 지정
        propsp.put("value.serializer", "org.apache.kafka.common.serialization.StringSerializer"); // 메시지 값의 직렬화 방식 지정
        // Kafka Producer 생성
        producer = new KafkaProducer<>(propsp);
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

    private void sendDOpostRequest(final Collection<SinkRecord> records) throws IOException {
        // conn = (HttpURLConnection) url.openConnection();
        // conn.setRequestMethod("POST");
        // conn.setRequestProperty("Content-Type", "application/json");
        // conn.setRequestProperty("Accept-Encoding", "application/json");
        // conn.setDoOutput(true); // 서버에서 온 데이터를 출력할 수 있는 상태인지

        // send POST Request


        List<String> attributes = config.getList("simulation.attribute");
        for (SinkRecord record : records) {
            if (record == null) {
                continue;
            }
            if (record.value() == null) {
                continue;
            }
            JSONObject input_data_data_obj = new JSONObject();
            try {
                // System.out.println(">>>try>>>>");
                JSONObject jsonRecordObject = new JSONObject(record.value().toString());
                // System.out.println("jsonRecordObject>>>>" + record.topic() + " : " + jsonRecordObject);
                String data = jsonRecordObject.getString("data");
                // System.out.println("data>>>>" + data);
                JSONObject jsonData = new JSONObject(data);
                ArrayList<String> sensor_id_list = new ArrayList<String>();
                ArrayList<JSONObject> data_list = new ArrayList<JSONObject>();
                // System.out.println("jsonData>>>>" + jsonData);
                for (String key : jsonData.keySet()) {
                    // System.out.println(key + " : " + jsonData.get(key).toString());
                    sensor_id_list.add(key);
                    // JSONObject sensor_data = new JSONObject(jsonData.get(key).toString());
                    // System.out.println("sensor_data : " + sensor_data);
                    // if (attributes.size() > 0) {
                    //     for (String attribute : attributes) {
                    //         input_data_data_obj.put(attribute, JsonPath.read(jsonData.get(key).toString(), "$." + attribute).toString());
                    //     }
                    //     data_list.add(input_data_data_obj);
                    //     input_data_data_obj = new JSONObject();
                    // } else {
                    //     data_list.add(sensor_data);
                    // }
                    if (attributes.size() > 0) {
                        for (String attribute : attributes) {
                            input_data_data_obj.put(attribute, JsonPath.read(jsonData.get(key).toString(), "$." + attribute).toString());
                        }
                        data_list.add(input_data_data_obj);
                    } else {
                        try {
                            JSONObject sensor_data = new JSONObject(jsonData.get(key).toString());
                            data_list.add(sensor_data);
                        } catch (Exception e) {// TODO: handle exception
                            JSONObject new_sensor_data = new JSONObject();
                            new_sensor_data.put(key, jsonData.get(key).toString());
                            //System.out.println("sensor_data : " + new_sensor_data);
                            data_list.add(new_sensor_data);
                        }
                    }
                    //System.out.println("data_list : " + data_list);
                }

                JSONObject input_data_obj = new JSONObject();
                input_data_obj.put("sensor_id", sensor_id_list);
                input_data_obj.put("data", data_list);
                input_data_obj.put("rowtime", jsonRecordObject.getString("rowtime"));
                input_data_list.add(input_data_obj);
                // System.out.println("input_data_obj : " + input_data_obj);

                if (input_data_list.size() >= time_step + 1) {
                    input_data_list = new ArrayList<JSONObject>(input_data_list.subList(1, time_step + 1));

                    UUID uuid = UUID.randomUUID();
                    String uuidStr = "S" + uuid.toString().replace("-", "");

                    StringBuilder builder = new StringBuilder();
                    JSONObject jsonObject = new JSONObject();
                    jsonObject.put("digital_twin_id", config.getString("digital.twin.id"));
                    jsonObject.put("simulation_id", config.getString("simulation.id"));
                    jsonObject.put("simulation_name", config.getString("simulation.name"));
                    jsonObject.put("simulation_attribute", config.getList("simulation.attribute"));
                    jsonObject.put("time_step", time_step);
                    jsonObject.put("simulation_subject", record.topic());
                    jsonObject.put("simulation_data_id", uuidStr);
                    jsonObject.put("input_data", input_data_list);
                    // System.out.println("###\n####\nsend: " + jsonObject);
                    builder.append(jsonObject);

                    conn = (HttpURLConnection) url.openConnection();
                    conn.setRequestMethod("POST");
                    conn.setRequestProperty("Content-Type", "application/json");
                    conn.setRequestProperty("Accept-Encoding", "application/json");
                    conn.setDoOutput(true); // 서버에서 온 데이터를 출력할 수 있는 상태인지
                    OutputStreamWriter writer = new OutputStreamWriter(conn.getOutputStream(), "UTF-8");
                    writer.write(builder.toString());
                    writer.close();

                    // get Response
                    int status = conn.getResponseCode();
                    if (Response.Status.Family.familyOf(status) != Response.Status.Family.SUCCESSFUL) {
                        //System.out.println("###\n####\n[get Response] FAIL " + conn.getResponseMessage());
                        BufferedReader reader = new BufferedReader(new InputStreamReader(conn.getErrorStream()));
                        String inputLine;
                        StringBuffer error = new StringBuffer();
                        while ((inputLine = reader.readLine()) != null) {
                            error.append(inputLine);
                        }
                        reader.close();
                    } else {
                        //System.out.println("###\n####\n[get Response] SUCCESSFUL: " + conn.getResponseMessage());
                        String line;
                        BufferedReader reader = new BufferedReader(new InputStreamReader(conn.getInputStream()));
                        JSONObject content_obj = null;
                        while ((line = reader.readLine()) != null) {
                            //System.out.println("line: " + line);
                            content_obj = new JSONObject(line);
                        }
                        reader.close();
                        // UTC 시간 출력
                        Instant now = Instant.now();
                        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss.SSS");
                        //System.out.println("\n\n\nUTC time: " + now.atZone(ZoneOffset.UTC).format(formatter));

                        responseResultObject.put("simulation_data_id", uuidStr);
                        responseResultObject.put("simulation_id", config.getString("simulation.id"));
                        responseResultObject.put("rowtime", now.atZone(ZoneOffset.UTC).format(formatter));
                        //responseResultObject.put("result_data", content_obj);
                        responseResultObject.put("result_data", content_obj.toString());
                        //System.out.println("###\nresponseResultObject: " + responseResultObject);
                        if (include_input) { //input option true
                            //responseResultObject.put("input_data", jsonObject);
                            responseResultObject.put("input_data", jsonObject.toString());
                            producer.send(new ProducerRecord<String, String>(config.getString("response.topic"), responseResultObject.toString()));
                        } else {
                            //responseResultObject.put("input_data", emptyJsonObject);
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
                //System.out.println(">>>try>>>>");
                JSONObject jsonRecordObject = new JSONObject(record.value().toString());
                //System.out.println("jsonRecordObject>>>>" + record.topic() + " : " + jsonRecordObject);
                String data = jsonRecordObject.getString("data");
                //System.out.println("data>>>>" + data);
                JSONObject jsonData = new JSONObject(data);
                //System.out.println("jsonData>>>>" + jsonData);
                for (String key : jsonData.keySet()) {
                    //System.out.println(key + " : " + jsonData.get(key).toString());
                    sensor_id_list.add(key);
                    JSONObject sensor_data = new JSONObject(jsonData.get(key).toString());
                    //System.out.println("sensor_data : " + sensor_data);
                    for (String attribute : attributes) {
                        System.out.println(attribute + " : " + sensor_data.get(attribute).toString());
                        input_data_data_obj.put(attribute, sensor_data.get(attribute).toString());
                        System.out.println("input_data_data_obj : " + input_data_data_obj);
                    }
                    data_list.add(input_data_data_obj);
                    //System.out.println("data_list : " + data_list);
                    input_data_data_obj = new JSONObject();
                }
                input_data_obj.put("sensor_id", sensor_id_list);
                input_data_obj.put("data", data_list);
                input_data_obj.put("rowtime", jsonRecordObject.getString("rowtime"));
                //System.out.println("input_data_obj >>>> " + input_data_obj);
                input_data_list.add(input_data_obj);

            } catch (Exception e) {
                System.out.println("Try-catch ParseException e" + e);
                continue;
            }


            UUID uuid = UUID.randomUUID();
            String uuidStr = "S" + uuid.toString().replace("-", "");


            // 추후 전송할 json 데이터 양식에 맞춰서 수정 필요
            String recordTopic = record.topic();
            //String recordValue = record.value().toString();

            jsonObject.put("digital_twin_id", config.getString("digital.twin.id"));
            jsonObject.put("simulation_id", config.getString("simulation.id"));
            jsonObject.put("simulation_name", config.getString("simulation.name"));
            jsonObject.put("simulation_attribute", config.getList("simulation.attribute"));
            jsonObject.put("time_step", time_step);
            jsonObject.put("simulation_subject", recordTopic);
            jsonObject.put("simulation_data_id", uuidStr);
            jsonObject.put("input_data", input_data_list);
            //System.out.println("###\nsend: " + jsonObject);
            builder.append(jsonObject);


        }

        OutputStreamWriter writer = new OutputStreamWriter(conn.getOutputStream(), "UTF-8");
        writer.write(builder.toString());
        writer.close();

        // get Response
        int status = conn.getResponseCode();
        if (Response.Status.Family.familyOf(status) != Response.Status.Family.SUCCESSFUL) {
            //System.out.println(" >>> response code: " + status + ", " + conn.getResponseMessage());
            //System.out.println(" >> get response here =========if= " + Response.Status.Family.familyOf(status) + " != " + Response.Status.Family.SUCCESSFUL);
            BufferedReader in = new BufferedReader(new InputStreamReader(conn.getErrorStream()));
            String inputLine;
            StringBuffer error = new StringBuffer();
            while ((inputLine = in.readLine()) != null) {
                error.append(inputLine);
            }
            in.close();
        } else {
            //System.out.println(" >>> response code: " + status + ", " + conn.getResponseMessage());
            //System.out.println(" >> get response here =========else= ");

            // write the response to the System.out.println       
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
            //System.out.println("###\nresponseResultObject: " + responseResultObject);
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
        logger.info("Stopping HttpSinkSimulationAttributeConnector task");
    }
}
