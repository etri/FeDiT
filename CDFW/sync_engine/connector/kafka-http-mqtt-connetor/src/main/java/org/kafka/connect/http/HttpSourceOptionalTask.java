package org.kafka.connect.http;

import org.apache.kafka.connect.data.Schema;
import org.apache.kafka.connect.header.ConnectHeaders;
import org.apache.kafka.connect.source.SourceRecord;
import org.apache.kafka.connect.source.SourceTask;
import org.json.JSONException;
import org.json.JSONObject;
import org.json.XML;

import javax.sql.DataSource;
import javax.ws.rs.core.Response;
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
import java.util.logging.FileHandler;
import java.util.logging.Level;
import java.util.logging.Logger;
import java.util.logging.SimpleFormatter;

public class HttpSourceOptionalTask extends SourceTask {
    // private final Logger logger = LoggerFactory.getLogger(HttpSourceOptionalConnector.class);
    Logger logger = Logger.getLogger("HttpSourceOptionalLogs");
    DataSource dataSource;
    URL url;
    HttpURLConnection conn;
    BufferedReader br;
    HttpSourceOptionalConnectorConfig config;
    String option;
    // UTC 시간 출력
    Instant now;
    DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss.SSS");
    int MAX_RETRY_COUNT = 3;
    private String key_topic;
    private String connectorName;

    @Override
    public String version() {
        return "1.0";
    }

    @Override
    public void start(Map<String, String> props) { // initialization
        logger.setLevel(Level.WARNING);
        FileHandler fh;
        // 초기화할 때, 필수 props 값이 없으면 ConnectException 에러 발생 시키도록 수정해라
        config = new HttpSourceOptionalConnectorConfig(props);
        connectorName = props.get("name");
        option = config.getString("data.source.format");
        try {
            url = new URL(config.getString("api.url"));
            key_topic = config.getString("kafka.topic");
            System.out.println("Check HTTP GET URL : " + config.getString("api.url"));
            fh = new FileHandler("/tmp/HttpSourceTaskLogs.log", 2000, 100, true);
            fh.setLevel(Level.WARNING);
            logger.addHandler(fh);
            SimpleFormatter formatter = new SimpleFormatter();
            fh.setFormatter(formatter);
        } catch (IOException e) {
            throw new RuntimeException(e);
        }

        logger.info("Starting HttpSourceOptionalConnector with connector name '{}'" + connectorName);
        logger.info("HttpSourceOptionalTask config setting : " + props.toString());

    }


    private String getOpenAPIjsonDataRequest(String key_topic) throws IOException {
        int retryCount = 0;
        boolean success = false;
        String strHttpData = "";
        while (retryCount < MAX_RETRY_COUNT && !success) {
            try {
                conn = (HttpURLConnection) url.openConnection();
                conn.setRequestProperty("Accept", "*/*;q=0.9");
                // get status check
                int status = conn.getResponseCode();
                if (Response.Status.Family.familyOf(status) != Response.Status.Family.SUCCESSFUL) {
                    logger.warning("[FAIL Response] json: " + conn.getResponseMessage() + config.getString("api.url"));
                    retryCount++;
                } else {
                    br = new BufferedReader(new InputStreamReader(conn.getInputStream(), "utf-8"));
                    StringBuilder sb = new StringBuilder();
                    String responseData;
                    while ((responseData = br.readLine()) != null) {
                        sb.append(responseData); // StringBuffer 에 응답받은 데이터 순차적 저장
                    }
                    now = Instant.now();
                    JSONObject http_data_obj = new JSONObject();

                    String httpData = String.valueOf(sb);
                    try {
                        JSONObject jsonNode = new JSONObject(httpData);
                        http_data_obj.put("data", jsonNode.toString());
                    } catch (Exception e) {
                        logger.warning(e + "\n[TypeError] not a json: " + httpData);
                        JSONObject jsonObject = new JSONObject();
                        jsonObject.put("TypeError", httpData);
                        http_data_obj.put("data", jsonObject.toString());
                    }

                    if ("UnalliedDigitalObjects".equals(key_topic)) {// Sensors
                        http_data_obj.put("federated_digital_twin_id", config.getString("federated.digital.twin.id"));
                        http_data_obj.put("digital_object_id", config.getString("digital.object.id"));
                    } else if ("Sensors".equals(key_topic)) {
                        http_data_obj.put("sensor_id", config.getString("sensor.id"));
                    }

                    http_data_obj.put("digital_twin_id", config.getString("digital.twin.id"));
                    http_data_obj.put("rowtime", now.atZone(ZoneOffset.UTC).format(formatter));
                    http_data_obj.put("location", "POINT EMPTY");
                    strHttpData = String.valueOf(http_data_obj);
                    br.close();
                    success = true;
                }

            } catch (JSONException e) {
                logger.warning(e.toString());
            }

            if (!success) {
                logger.warning("Max retry count exceeded. Failed to complete GET request.");
            }
        }
        return strHttpData;
    }


    private String getOpenAPIdataXmlToJsonRequest(String key_topic) throws IOException {
        int retryCount = 0;
        boolean success = false;
        String strHttpData = "";
        while (retryCount < MAX_RETRY_COUNT && !success) {
            try {
                conn = (HttpURLConnection) url.openConnection();
                conn.setRequestProperty("Accept", "*/*;q=0.9");
                // get status check
                int status = conn.getResponseCode();
                if (Response.Status.Family.familyOf(status) != Response.Status.Family.SUCCESSFUL) {
                    logger.warning("[FAIL Response] XML: " + conn.getResponseMessage() + config.getString("api.url"));
                    retryCount++;
                } else {
                    br = new BufferedReader(new InputStreamReader(conn.getInputStream(), "utf-8"));
                    StringBuilder sb = new StringBuilder();
                    String responseData;
                    while ((responseData = br.readLine()) != null) {
                        sb.append(responseData); // StringBuffer 에 응답받은 데이터 순차적 저장
                    }

                    String httpData = String.valueOf(sb);
                    JSONObject jsonObj = XML.toJSONObject(httpData);
                    now = Instant.now();
                    JSONObject http_data_obj = new JSONObject();

                    if ("UnalliedDigitalObjects".equals(key_topic)) {
                        http_data_obj.put("federated_digital_twin_id", config.getString("federated.digital.twin.id"));
                        http_data_obj.put("digital_object_id", config.getString("digital.object.id"));
                    } else if ("Sensors".equals(key_topic)) {
                        http_data_obj.put("sensor_id", config.getString("sensor.id"));
                    }

                    http_data_obj.put("digital_twin_id", config.getString("digital.twin.id"));
                    http_data_obj.put("data", jsonObj.toString());
                    http_data_obj.put("rowtime", now.atZone(ZoneOffset.UTC).format(formatter));
                    http_data_obj.put("location", "POINT EMPTY");
                    strHttpData = String.valueOf(http_data_obj);
                    br.close();
                    success = true;
                }

            } catch (JSONException e) {
                logger.warning(e.toString());
            }

            if (!success) {
                logger.warning("Max retry count exceeded. Failed to complete GET request.");
            }
        }
        return strHttpData;
    }


    @Override
    public List<SourceRecord> poll() throws InterruptedException {
        final long sleepMs = config.getInt("poll.interval.ms");

        if (sleepMs > 0) {
            Thread.sleep(sleepMs);
        }

        List<SourceRecord> records = new ArrayList<>();

        try {
            String data = null;

            if ("UnalliedDigitalObjects".equals(key_topic) || "Sensors".equals(key_topic)) {
                if (option.equals("xml")) {
                    data = getOpenAPIdataXmlToJsonRequest(key_topic);
                } else {
                    data = getOpenAPIjsonDataRequest(key_topic);
                }

                if (data == null) {
                    logger.warning("[data null] There is something wrong with the data");
                } else {
                    JSONObject kafka_key = new JSONObject();

                    if ("UnalliedDigitalObjects".equals(key_topic)) {
                        kafka_key.put("digital_object_id", config.getString("digital.object.id"));
                    } else if ("Sensors".equals(key_topic)) {
                        kafka_key.put("sensor_id", config.getString("sensor.id"));
                    }

                    String strkafkaKey = String.valueOf(kafka_key);
                    records.add(dataConvert(data, strkafkaKey));
                }
            } else {
                System.out.println("Unsupported resource_type: " + key_topic);
            }

            return records;
        } catch (IOException e) {
            logger.warning("[poll try-catch Exception] " + e);
            throw new RuntimeException(e);
        }
    }

    protected SourceRecord dataConvert(String httpMessage, String strkafkaKey) {
//        System.out.printf("Converting HTTP Message : %s", httpMessage);

        ConnectHeaders headers = new ConnectHeaders();
        SourceRecord sourceRecord = new SourceRecord(
                new HashMap<>(),  // java.util.Map<java.lang.String,?> sourcePartition
                new HashMap<>(),  // java.util.Map<java.lang.String,?> sourceOffset,
                key_topic,  // java.lang.String topic
                (Integer) null,  // java.lang.Integer partition
                Schema.STRING_SCHEMA,  // Schema keySchema
                strkafkaKey,  // java.lang.Object key (kafka message key)
                Schema.STRING_SCHEMA,  // Schema valueSchema
                httpMessage,  // java.lang.Object value (kafka message value)
                System.currentTimeMillis(),  // java.lang.Long timestamp
                headers  // java.lang.Iterable<Header> headers
        );

        //System.out.println("Converted HTTP Message : " + sourceRecord);
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
