package org.kafka.connect.http;

import org.kafka.connect.util.JSONException;
import org.kafka.connect.util.JSONObject;
//import org.apache.kafka.common.utils.Time;
import org.apache.kafka.connect.data.Schema;
import org.apache.kafka.connect.header.ConnectHeaders;
import org.apache.kafka.connect.source.SourceRecord;
import org.apache.kafka.connect.source.SourceTask;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.net.*;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class HttpSourceTask extends SourceTask{

    private final Logger logger = LoggerFactory.getLogger(HttpSourceConnector.class);
    private String connectorName;
    URL url;
    HttpURLConnection conn;
    BufferedReader br;
    HttpSourceConnectorConfig config;


    @Override
    public String version() {
        return "1.0";
    }


    @Override
    public void start(Map<String, String> props) { // initialization
        // 초기화할 때, 필수 props 값이 없으면 ConnectException 에러 발생 시키도록 수정해라
        config = new HttpSourceConnectorConfig(props);
        connectorName = props.get("name");
        try {
            url = new URL(config.getString("api.url"));
            System.out.println("Check HTTP GET URL : "+config.getString("api.url"));
        } catch (IOException e) {
            throw new RuntimeException(e);
        }

        logger.info("Starting HttpSourceConnector with connector name '{}'", connectorName);
        logger.info("HttpSourceTask config setting : " + props.toString());

    }

    private String getRequest(String jsonKey) throws IOException {
        conn = (HttpURLConnection) url.openConnection();
        conn.setRequestProperty("Accept", "application/json");
        br = new BufferedReader(new InputStreamReader(conn.getInputStream(), "utf-8"));

        StringBuilder sb = new StringBuilder();
        String responseData;
        while ((responseData = br.readLine()) != null) {
            sb.append(responseData); // StringBuffer 에 응답받은 데이터 순차적 저장
        }

        String httpData = String.valueOf(sb);
        String data = null;

        try {
            // 여기는 json 형식별로 너무 커스터마이징 하드코딩이 필요한디... 한번에 어케 안되니?
            System.out.println("HTTP DATA : "+httpData);
            JSONObject jsonObject = new JSONObject(httpData);
            JSONObject resp = jsonObject.getJSONObject("response");
            JSONObject body = resp.getJSONObject("body");
            data = String.valueOf(body.getInt(jsonKey));

            return data;
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
                records.add(dataConvert(data));
            }
            return records;
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }

    protected SourceRecord dataConvert(String httpMessage) {
//        System.out.printf("Converting HTTP Message : %s", httpMessage);

        ConnectHeaders headers = new ConnectHeaders();
        SourceRecord sourceRecord = new SourceRecord(
                new HashMap<>(),  // java.util.Map<java.lang.String,?> sourcePartition
                new HashMap<>(),  // java.util.Map<java.lang.String,?> sourceOffset,
                config.getString("kafka.topic"),  // java.lang.String topic
                (Integer) null,  // java.lang.Integer partition
                Schema.STRING_SCHEMA,  // Schema keySchema
                "GET",  // java.lang.Object key (kafka message key)
                Schema.STRING_SCHEMA,  // Schema valueSchema
                httpMessage,  // java.lang.Object value (kafka message value)
                System.currentTimeMillis(),  // java.lang.Long timestamp
                headers  // java.lang.Iterable<Header> headers
        );

        System.out.println("Converted HTTP Message : "+ sourceRecord);
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
