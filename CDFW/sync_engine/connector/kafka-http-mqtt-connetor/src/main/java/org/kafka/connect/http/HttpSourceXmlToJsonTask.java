package org.kafka.connect.http;

import org.apache.kafka.connect.data.Schema;
import org.apache.kafka.connect.header.ConnectHeaders;
import org.apache.kafka.connect.source.SourceRecord;
import org.apache.kafka.connect.source.SourceTask;
import org.json.JSONException;
import org.json.JSONObject;
import org.json.XML;
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

public class HttpSourceXmlToJsonTask extends SourceTask {

    private final Logger logger = LoggerFactory.getLogger(HttpSourceXmlToJsonConnector.class);
    URL url;
    HttpURLConnection conn;
    BufferedReader br;
    HttpSourceXmlToJsonConnectorConfig config;
    // UTC 시간 출력
    Instant now = Instant.now();
    DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss.SSS");
    private String connectorName;

    @Override
    public String version() {
        return "1.0";
    }

    @Override
    public void start(Map<String, String> props) { // initialization
        // 초기화할 때, 필수 props 값이 없으면 ConnectException 에러 발생 시키도록 수정해라
        config = new HttpSourceXmlToJsonConnectorConfig(props);
        connectorName = props.get("name");
        try {
            url = new URL(config.getString("api.url"));
            System.out.println("Check HTTP GET URL : " + config.getString("api.url"));
        } catch (IOException e) {
            throw new RuntimeException(e);
        }

        logger.info("Starting HttpSourceXmlToJsonConnector with connector name '{}'", connectorName);
        logger.info("HttpSourceXmlToJsonTask config setting : " + props.toString());

    }

    private String getRequest(String jsonKey) throws IOException {
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
            JSONObject jsonObj = XML.toJSONObject(httpData);
            String jsonData = jsonObj.toString();

            JSONObject http_data_obj = new JSONObject();
            http_data_obj.put("digital_twin_id", config.getString("digital.twin.id"));
            http_data_obj.put("sensor_id", config.getString("sensor.id"));
            http_data_obj.put("data", jsonData);
            http_data_obj.put("rowtime", now.atZone(ZoneOffset.UTC).format(formatter));
            http_data_obj.put("location", "{}");
            String strHttpData = String.valueOf(http_data_obj);
            //System.out.println("data set HTTP DATA : " + strHttpData);

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
            String data = getRequest(config.getString("api.key"));
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

        //System.out.println("Converted HTTP Message : "+ sourceRecord);
        return sourceRecord;
    }

    @Override
    public void stop() {
        // 요기서도 release 해주는게 맞나??
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
