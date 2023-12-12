package org.kafka.connect.http;

import org.apache.kafka.connect.data.Schema;
import org.apache.kafka.connect.header.ConnectHeaders;
import org.apache.kafka.connect.source.SourceRecord;
import org.apache.kafka.connect.source.SourceTask;
import org.json.JSONException;
import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.time.Instant;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class HttpSourceJsonStringTask extends SourceTask {

    private final Logger logger = LoggerFactory.getLogger(HttpSourceJsonStringConnector.class);
    URL url;
    HttpURLConnection conn;
    BufferedReader br;
    HttpSourceJsonStringConnectorConfig config;
    private String connectorName;

    @Override
    public String version() {
        return "1.0";
    }

    // UTC 시간 출력
    Instant now = Instant.now();
    DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss.SSS");

    @Override
    public void start(Map<String, String> props) { // initialization
        // 초기화할 때, 필수 props 값이 없으면 ConnectException 에러 발생 시키도록 수정해라
        config = new HttpSourceJsonStringConnectorConfig(props);
        connectorName = props.get("name");
        try {
            url = new URL(config.getString("api.url"));
            System.out.println("Check HTTP GET URL : " + config.getString("api.url"));
        } catch (IOException e) {
            throw new RuntimeException(e);
        }

        logger.info("Starting HttpSourceJsonStringConnector with connector name '{}'", connectorName);
        logger.info("HttpSourceJsonStringTask config setting : " + props.toString());

    }

    private String getRequest() throws IOException {
        try {
            conn = (HttpURLConnection) url.openConnection();
            conn.setRequestProperty("Accept", "*/*;q=0.9");
            br = new BufferedReader(new InputStreamReader(conn.getInputStream(), "utf-8"));

            StringBuilder sb = new StringBuilder();
            String responseData;
            while ((responseData = br.readLine()) != null) {
                sb.append(responseData); // StringBuffer 에 응답받은 데이터 순차적 저장
            }

            String httpData = String.valueOf(sb);
            
            JSONObject http_data_obj = new JSONObject();
            http_data_obj.put("digital_twin_id", config.getString("digital.twin.id"));
            http_data_obj.put("sensor_id", config.getString("sensor.id"));
            http_data_obj.put("data", httpData);
            http_data_obj.put("rowtime", now.atZone(ZoneOffset.UTC).format(formatter));
            http_data_obj.put("location", "{}");
            String strHttpData = String.valueOf(http_data_obj);
            System.out.println("data set HTTP DATA : " + strHttpData);

            return strHttpData;
        } catch (JSONException e) {
            System.out.println(e);
            return null;
        } finally {
            br.close();
            conn.disconnect();
        }
    }



    @Override
    public List<SourceRecord> poll() throws InterruptedException {
        final long sleepMs = config.getInt("poll.interval.ms");
        if (sleepMs > 0) {
            Thread.sleep(sleepMs);
        }
        List<SourceRecord> records = new ArrayList<>();
        try {
            String data = getRequest();
            if (data == null) {
                System.out.println("There is some thing wrong data from url");
            } else {
                JSONObject kafka_key = new JSONObject();
                kafka_key.put("digital_twin_id", config.getString("digital.twin.id"));
                String strkafkaKey = String.valueOf(kafka_key);
                records.add(dataConvert(data, strkafkaKey));
            }
            return records;
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }

    protected SourceRecord dataConvert(String httpMessage, String strkafkaKey) {
//        System.out.printf("Converting HTTP Message : %s", httpMessage);

        ConnectHeaders headers = new ConnectHeaders();
        SourceRecord sourceRecord = new SourceRecord(
                new HashMap<>(),  // java.util.Map<java.lang.String,?> sourcePartition
                new HashMap<>(),  // java.util.Map<java.lang.String,?> sourceOffset,
                config.getString("kafka.topic"),  // java.lang.String topic
                (Integer) null,  // java.lang.Integer partition
                Schema.STRING_SCHEMA,  // Schema keySchema
                strkafkaKey,  // java.lang.Object key (kafka message key)
                Schema.STRING_SCHEMA,  // Schema valueSchema
                httpMessage,  // java.lang.Object value (kafka message value)
                System.currentTimeMillis(),  // java.lang.Long timestamp
                headers  // java.lang.Iterable<Header> headers
        );

        System.out.println("Converted HTTP Message : " + sourceRecord);
        return sourceRecord;
    }

    @Override
    public void stop() {
        if (br != null) {
            try {
                br.close();
            } catch (IOException e) {
                throw new RuntimeException(e);
            }
        }
        if (conn != null) {
            conn.disconnect();
        }
    }
}
