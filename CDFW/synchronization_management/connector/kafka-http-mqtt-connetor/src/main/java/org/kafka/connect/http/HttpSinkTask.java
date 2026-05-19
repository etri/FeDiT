package org.kafka.connect.http;

import org.apache.kafka.clients.consumer.OffsetAndMetadata;
import org.apache.kafka.common.TopicPartition;
import org.apache.kafka.connect.sink.SinkRecord;
import org.apache.kafka.connect.sink.SinkTask;
import org.kafka.connect.util.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.OutputStreamWriter;
import java.net.HttpURLConnection;
import java.net.MalformedURLException;
import java.net.URL;
import java.util.Collection;
import java.util.Map;

public class HttpSinkTask extends SinkTask {

    private final Logger logger = LoggerFactory.getLogger(HttpSinkConnector.class);
    private String connectorName;
    URL url;
    HttpURLConnection conn;
    BufferedReader br;
    HttpSinkConnectorConfig config;

    @Override
    public String version() {
        return "1.0";
    }

    @Override
    public void start(Map<String, String> props) {
        config = new HttpSinkConnectorConfig(props);
        connectorName = props.get("name");
        try {
            url = new URL(config.getString("http.api.url"));
            System.out.println("Check HTTP GET URL : "+config.getString("http.api.url"));
        } catch (MalformedURLException e) {
            throw new RuntimeException(e);
        }

        logger.info("Starting HttpSinkConnector with connector name '{}'", connectorName);
        logger.info("HttpSinkTask config setting : " + props.toString());
    }

    @Override
    public void put(Collection<SinkRecord> records) { // record 를 가져와서 데이터 처리
        // topic 에서 polling 되어 처리가 되어야 하는 다수의 레코드
        if (records.isEmpty()) {
            return ;
        }

        try {
            sendPostRequest(records);
        } catch (Exception e) {
            throw new RuntimeException(e);
            // retry 할지 말지 나중에 정하고 추가해~
        }

    }

    private void sendPostRequest(final Collection<SinkRecord> records) throws IOException {
        conn = (HttpURLConnection) url.openConnection();
        conn.setRequestMethod("POST");
        conn.setRequestProperty("Content-Type", "application/json");
        conn.setRequestProperty("Accept-Encoding", "application/json");
        conn.setDoOutput(true); // 서버에서 온 데이터를 출력할 수 있는 상태인지

        // send POST Request
        StringBuilder sb = new StringBuilder();
        JSONObject jsonObject = new JSONObject();
        for (SinkRecord record : records) {
//            StringBuilder sb = new StringBuilder();
//            if (record == null) {
//                continue;
//            }
            if (record.value() == null) {
                continue;
            }

            // 추후 전송할 json 데이터 양식에 맞춰서 수정 필요
            String recordTopic = record.topic();
            String recordValue = record.value().toString();
            jsonObject.put(recordTopic, recordValue);
            sb.append(jsonObject);

        }

        OutputStreamWriter writer = new OutputStreamWriter(conn.getOutputStream(), "UTF-8");
        writer.write(sb.toString());
        writer.close();

        // get Response
        int status = conn.getResponseCode();
        System.out.println("RESPONSE CODE : "+status);

        conn.disconnect();
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
