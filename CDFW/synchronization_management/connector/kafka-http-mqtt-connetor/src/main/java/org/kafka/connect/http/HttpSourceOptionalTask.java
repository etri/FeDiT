package org.kafka.connect.http;

import org.apache.kafka.connect.data.Schema;
import org.apache.kafka.connect.errors.ConnectException;
import org.apache.kafka.connect.header.ConnectHeaders;
import org.apache.kafka.connect.source.SourceRecord;
import org.apache.kafka.connect.source.SourceTask;
import org.kafka.connect.util.JSONObject;
import org.kafka.connect.util.XML;

import java.io.BufferedReader;
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
    private final Logger logger = Logger.getLogger("HttpSourceOptionalLogs");

    private HttpSourceOptionalConnectorConfig config;

    private URL url;
    private String option;          // "json" | "xml"
    private String keyTopic;        // "Sensors" | "UnalliedDigitalObjects"
    private String connectorName;

    private static final int MAX_RETRY_COUNT = 3;
    private static final DateTimeFormatter FORMATTER =
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss.SSS");

    // 2xx 성공 판정
    private static boolean isSuccessful(int status) {
        return status >= 200 && status < 300;
    }

    @Override
    public String version() {
        return "1.0";
    }

    @Override
    public void start(Map<String, String> props) {
        // 로그 설정
        logger.setLevel(Level.WARNING);

        try {
            FileHandler fh = new FileHandler("/tmp/HttpSourceTaskLogs.log", 2000, 100, true);
            fh.setLevel(Level.WARNING);
            fh.setFormatter(new SimpleFormatter());
            logger.addHandler(fh);
        } catch (Exception e) {
            // 파일 로거 실패는 치명적이지 않게 진행
            logger.warning("[LOGGER INIT ERROR] " + e);
        }

        // config 로드
        config = new HttpSourceOptionalConnectorConfig(props);
        connectorName = props.get("name");

        // 필수값 검증 (누락 시 즉시 fail)
        final String apiUrl = requireNonBlank(config.getString("api.url"), "api.url");
        keyTopic = requireNonBlank(config.getString("kafka.topic"), "kafka.topic");
        option = requireNonBlank(config.getString("data.source.format"), "data.source.format"); // json|xml

        requireNonBlank(config.getString("digital.twin.id"), "digital.twin.id");

        // topic별 필수 id 검증
        if ("Sensors".equals(keyTopic)) {
            requireNonBlank(config.getString("sensor.id"), "sensor.id");
        } else if ("UnalliedDigitalObjects".equals(keyTopic)) {
            requireNonBlank(config.getString("digital.object.id"), "digital.object.id");
        } else {
            throw new ConnectException("Unsupported kafka.topic: " + keyTopic
                    + " (supported: Sensors, UnalliedDigitalObjects)");
        }

        try {
            url = new URL(apiUrl);
            System.out.println("Check HTTP GET URL : " + apiUrl);
        } catch (Exception e) {
            throw new ConnectException("Invalid api.url: " + apiUrl, e);
        }

        logger.warning("Starting HttpSourceOptionalTask. connectorName=" + connectorName
                + ", topic=" + keyTopic + ", format=" + option + ", api.url=" + apiUrl);
    }

    @Override
    public List<SourceRecord> poll() throws InterruptedException {
        final long sleepMs = config.getInt("poll.interval.ms");
        if (sleepMs > 0) {
            Thread.sleep(sleepMs);
        }

        List<SourceRecord> records = new ArrayList<>();

        try {
            // 1) HTTP body 수집 + 파싱 + Kafka value 조립
            final String kafkaValue = fetchAndBuildKafkaValue();
            if (kafkaValue == null || kafkaValue.trim().isEmpty()) {
                // 빈값 발행 방지
                logger.warning("[SKIP] kafkaValue is null/empty. topic=" + keyTopic);
                return records;
            }

            // 2) Kafka key 조립(필수 id 기반)
            final String kafkaKey = buildKafkaKey();
            if (kafkaKey == null) {
                logger.warning("[SKIP] kafkaKey is null. topic=" + keyTopic);
                return records;
            }

            // 3) SourceRecord 생성
            records.add(dataConvert(kafkaValue, kafkaKey));
            return records;

        } catch (Exception e) {
            logger.warning("[poll Exception] " + e);
            throw new RuntimeException(e);
        }
    }

    /**
     * 공통: HTTP GET + retry + body 읽기
     */
    private String fetchHttpBodyWithRetry() {
        int retryCount = 0;

        while (retryCount < MAX_RETRY_COUNT) {
            HttpURLConnection conn = null;
            BufferedReader br = null;

            try {
                conn = (HttpURLConnection) url.openConnection();
                conn.setRequestProperty("Accept", "*/*;q=0.9");

                int status = conn.getResponseCode();
                if (!isSuccessful(status)) {
                    logger.warning("[FAIL Response] status=" + status
                            + " msg=" + conn.getResponseMessage()
                            + " url=" + config.getString("api.url"));
                    retryCount++;
                    continue;
                }

                br = new BufferedReader(new InputStreamReader(conn.getInputStream(), "utf-8"));
                StringBuilder sb = new StringBuilder();
                String line;
                while ((line = br.readLine()) != null) sb.append(line);

                String body = sb.toString().trim();
                if (body.isEmpty()) {
                    logger.warning("[EMPTY BODY] 2xx but response body is empty. url=" + config.getString("api.url"));
                    return null;
                }

                return body;

            } catch (Exception e) {
                retryCount++;
                logger.warning("[REQUEST ERROR] retry=" + retryCount + " err=" + e);

                // 간단 backoff (선택)
                try {
                    Thread.sleep(200L * retryCount);
                } catch (InterruptedException ie) {
                    Thread.currentThread().interrupt();
                    return null;
                }

            } finally {
                try { if (br != null) br.close(); } catch (Exception ignore) {}
                if (conn != null) conn.disconnect();
            }
        }

        logger.warning("[MAX RETRY EXCEEDED] Failed to complete GET request. url=" + config.getString("api.url"));
        return null;
    }

    /**
     * JSON body -> data(JSON string)
     */
    private String parseToDataJsonString(final String body) {
        try {
            JSONObject jsonNode = new JSONObject(body);
            return jsonNode.toString();
        } catch (Exception e) {
            logger.warning("[NOT JSON] " + e + " body=" + safeShort(body));
            return null;
        }
    }

    /**
     * XML body -> data(JSON string)
     */
    private String parseXmlToDataJsonString(final String body) {
        try {
            JSONObject jsonObj = XML.toJSONObject(body);
            return jsonObj.toString();
        } catch (Exception e) {
            logger.warning("[NOT XML] " + e + " body=" + safeShort(body));
            return null;
        }
    }

    /**
     * 공통: body를 받아서 (option에 따라) dataJsonString 생성 후 최종 Kafka value 조립
     */
    private String fetchAndBuildKafkaValue() {
        final String body = fetchHttpBodyWithRetry();
        if (body == null) return null;

        final String dataJsonString;
        if ("xml".equalsIgnoreCase(option)) {
            dataJsonString = parseXmlToDataJsonString(body);
        } else {
            // 기본 json 취급
            dataJsonString = parseToDataJsonString(body);
        }

        return buildKafkaValue(dataJsonString);
    }

    /**
     * 공통: 최종 value(payload) 조립
     */
    private String buildKafkaValue(final String dataJsonString) {
        if (dataJsonString == null) return null;

        final String trimmed = dataJsonString.trim();
        if (trimmed.isEmpty() || "{}".equals(trimmed)) {
            logger.warning("[SKIP] dataJsonString empty/{}. topic=" + keyTopic);
            return null;
        }

        Instant now = Instant.now();

        JSONObject obj = new JSONObject();
        obj.put("digital_twin_id", config.getString("digital.twin.id"));
        obj.put("data", dataJsonString);
        obj.put("rowtime", now.atZone(ZoneOffset.UTC).format(FORMATTER));
        obj.put("location", "POINT EMPTY");

        if ("UnalliedDigitalObjects".equals(keyTopic)) {
            obj.put("digital_object_id", config.getString("digital.object.id"));
        } else if ("Sensors".equals(keyTopic)) {
            obj.put("sensor_id", config.getString("sensor.id"));
        }

        return obj.toString();
    }

    /**
     * topic별 key 생성
     */
    private String buildKafkaKey() {
        JSONObject kafkaKey = new JSONObject();

        if ("UnalliedDigitalObjects".equals(keyTopic)) {
            final String id = config.getString("digital.object.id");
            if (id == null || id.trim().isEmpty()) return null;
            kafkaKey.put("digital_object_id", id);

        } else if ("Sensors".equals(keyTopic)) {
            final String id = config.getString("sensor.id");
            if (id == null || id.trim().isEmpty()) return null;
            kafkaKey.put("sensor_id", id);

        } else {
            return null;
        }

        return kafkaKey.toString();
    }

    protected SourceRecord dataConvert(String httpMessage, String strkafkaKey) {
        ConnectHeaders headers = new ConnectHeaders();
        return new SourceRecord(
                new HashMap<>(),               // sourcePartition
                new HashMap<>(),               // sourceOffset
                keyTopic,                      // topic
                (Integer) null,                // partition
                Schema.STRING_SCHEMA,          // keySchema
                strkafkaKey,                   // key
                Schema.STRING_SCHEMA,          // valueSchema
                httpMessage,                   // value
                System.currentTimeMillis(),    // timestamp
                headers                        // headers
        );
    }

    @Override
    public void stop() {
        // 현재 구현은 poll마다 stream/conn을 열고 닫으므로 stop에서 닫을 리소스가 거의 없음
        logger.warning("Stopping HttpSourceOptionalTask. connectorName=" + connectorName);
    }

    private String requireNonBlank(String v, String key) {
        if (v == null || v.trim().isEmpty()) {
            throw new ConnectException("Missing required config: " + key);
        }
        return v;
    }

    private static String safeShort(String s) {
        if (s == null) return null;
        final String t = s.trim();
        return t.length() > 300 ? t.substring(0, 300) + "..." : t;
    }
}
