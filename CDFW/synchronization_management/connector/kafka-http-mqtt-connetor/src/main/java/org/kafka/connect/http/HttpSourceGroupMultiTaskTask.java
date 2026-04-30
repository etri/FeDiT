package org.kafka.connect.http;

import org.apache.kafka.connect.data.Schema;
import org.apache.kafka.connect.errors.ConnectException;
import org.apache.kafka.connect.header.ConnectHeaders;
import org.apache.kafka.connect.source.SourceRecord;
import org.apache.kafka.connect.source.SourceTask;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.time.Instant;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.logging.Logger;
import java.util.Collections;

/**
 * HttpSourceGroupMultiTaskTask
 *
 * - 공통화: HTTP 호출 + retry + body 읽기 / value 조립 로직을 분리
 * - 빈값 방지: objectId/twinId/body/dataJsonString이 비면 레코드 발행 자체를 스킵
 * - URL join 수정: baseUrl/path 조합 시 슬래시 중복/누락을 정확히 처리
 *
 * NOTE:
 * - 본 코드는 "UnalliedDigitalObjects" 토픽으로 발행
 * - value와 key는 Schema.STRING_SCHEMA로 발행 (StringConverter/JsonConverter(schema disable) 모두 대응 가능)
 */
public class HttpSourceGroupMultiTaskTask extends SourceTask {
    private final Logger logger = Logger.getLogger("HttpSourceGroupMultiTaskLogs");

    private HttpSourceGroupMultiTaskConnectorConfig config;

    private String connectorName;
    private String option;          // "json" | "xml"(여기서는 JSON 응답 기준이지만 옵션 유지)
    private String keyTopic;        // fixed: UnalliedDigitalObjects

    private String baseUrl;
    private List<String> changeUrls;
    private List<String> twinIds;
    private List<String> resourceIds;

    private String resourceName;
    // 리밸런싱/stop 시 빠르게 중단하기 위한 플래그
    private volatile boolean running = true;

    // HTTP timeout
    private int connectTimeoutMs = 3000;
    private int readTimeoutMs = 7000;
    private int taskIndex = -1;
    private int taskCount = -1;
    private String workerId = "unknown";

    // stop()에서 poll sleep을 즉시 깨우기 위한 스레드 핸들
    private volatile Thread pollThread;

    // stop()에서 HTTP 블로킹을 즉시 끊기 위한 커넥션 핸들
    private volatile HttpURLConnection currentConn;
    // poll 요약 로그 제어
    private long lastPollLogTs = 0L;
    private static final long POLL_LOG_INTERVAL_MS = 60_000; // 60초
    private static final int MAX_RETRY_COUNT = 3;
    private static final DateTimeFormatter FORMATTER =
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss.SSS");

    private static boolean isSuccessful(int status) {
        return status >= 200 && status < 300;
    }

    @Override
    public String version() {
        return "1.0";
    }

    @Override
    public void start(Map<String, String> props) {
        config = new HttpSourceGroupMultiTaskConnectorConfig(props);

        connectorName = props.getOrDefault("name", "HttpSourceGroupMultiTaskTask");

        // task meta
        try {
            taskIndex = Integer.parseInt(props.getOrDefault("task.index", "-1"));
            taskCount = Integer.parseInt(props.getOrDefault("task.count", "-1"));
        } catch (Exception ignore) {}

        // worker 식별 (hostname)
        try {
            workerId = java.net.InetAddress.getLocalHost().getHostName();
        } catch (Exception ignore) {}


        option = nonBlankOrDefault(config.getString("data.source.format"), "json");
        keyTopic = "UnalliedDigitalObjects";

        resourceName = "digital_object_id";
        baseUrl = requireNonBlank(config.getString("api.base.url"), "api.base.url");

        // HTTP timeout 설정
        try {
            connectTimeoutMs = config.getInt("http.connect.timeout.ms");
            readTimeoutMs = config.getInt("http.read.timeout.ms");
        } catch (Exception ignore) {
            // 구버전 config와의 호환
        }

        // per-task url 리스트 우선 사용 (Connector가 task.change.urls로 내려줌)
        // fallback: api.change.url (기존 방식)
        String taskUrlsCsv = props.getOrDefault("task.change.urls", "").trim();
        if (!taskUrlsCsv.isEmpty()) {
            changeUrls = Arrays.stream(taskUrlsCsv.split(","))
                    .map(String::trim)
                    .filter(s -> !s.isEmpty())
                    .collect(Collectors.toList());
        } else {
            // changeUrls: optional (empty면 baseUrl만 호출)
            changeUrls = safeList(config.getList("api.change.url")).stream()
                    .map(String::trim)
                    .filter(s -> !s.isEmpty())
                    .distinct()
                    .collect(Collectors.toList());
        }

        // 필수: 최소 1개 이상
        twinIds = safeList(config.getList("digital.twin.id"));
        if (twinIds.isEmpty()) {
            throw new ConnectException("Missing required config list: digital.twin.id (must contain at least 1 item)");
        }

        resourceIds = safeList(config.getList("digital.object.id"));
        if (resourceIds.isEmpty()) {
            throw new ConnectException("Missing required config list: digital.object.id (must contain at least 1 item)");
        }

        logger.info(() -> String.format(
            "[START] connector=%s worker=%s task=%d/%d baseUrl=%s urls=%s twinIds=%s resourceIds=%s option=%s timeouts=(%d/%d)",
            connectorName,
            workerId,
            taskIndex,
            taskCount,
            baseUrl,
            changeUrls,
            twinIds,
            resourceIds,
            option,
            connectTimeoutMs,
            readTimeoutMs
        ));
    }

    @Override
    public List<SourceRecord> poll() throws InterruptedException {
        pollThread = Thread.currentThread();
        if (!running) return Collections.emptyList();

        final long sleepMs = config.getInt("poll.interval.ms");
        try {
            Thread.sleep(sleepMs > 0 ? sleepMs : 1000);
        } catch (InterruptedException ie) {
            // stop/rebalance 유도 종료
            Thread.currentThread().interrupt();
            return Collections.emptyList();
        }

        if (!running) return Collections.emptyList();

        final List<SourceRecord> records = new ArrayList<>();
        int success = 0;
        int fail = 0;
        // changeUrls가 없으면 baseUrl 1회만
        if (changeUrls.isEmpty()) {
            final String fullUrl = baseUrl;

            final String objectId = pickCyclic(resourceIds, 0);
            final String twinId = pickCyclic(twinIds, 0);

            final SourceRecord rec = buildRecordFor(fullUrl, objectId, twinId);
            if (rec != null) {
                records.add(rec);
                success++;
            } else {
                fail++;
            }

            return records;
        }

        // changeUrls가 있으면 각 url마다 1레코드 생성
        for (int i = 0; i < changeUrls.size(); i++) {
            if (!running) break;
            final String path = changeUrls.get(i);
            final String fullUrl = joinUrl(baseUrl, path);

            final String objectId = pickCyclic(resourceIds, i);
            final String twinId = pickCyclic(twinIds, i);

            final SourceRecord rec = buildRecordFor(fullUrl, objectId, twinId);
            if (rec != null) {
                records.add(rec);
                success++;
            } else {
                fail++;
            }
        }

        // poll 요약 로그 (주기적)
        long now = System.currentTimeMillis();
        if (now - lastPollLogTs > POLL_LOG_INTERVAL_MS) {
            lastPollLogTs = now;
            logger.info(String.format(
                "[POLL] worker=%s task=%d/%d urls=%d success=%d fail=%d",
                workerId,
                taskIndex,
                taskCount,
                changeUrls.size(),
                success,
                fail
            ));
        }

        return records;
    }

    /**
     * (1) HTTP fetch (retry 포함) -> (2) payload 조립 -> (3) SourceRecord 생성
     */
    private SourceRecord buildRecordFor(final String fullUrl, final String objectId, final String twinId) {
        // 필수 식별자 방어
        if (isBlank(objectId)) {
            logger.warning("[SKIP] objectId is blank. url=" + fullUrl);
            return null;
        }
        if (isBlank(twinId)) {
            logger.warning("[SKIP] twinId is blank. url=" + fullUrl + ", objectId=" + objectId);
            return null;
        }

        final String body = fetchHttpBodyWithRetry(fullUrl);
        if (isBlank(body)) {
            logger.warning("[SKIP] body is empty. url=" + fullUrl);
            return null;
        }

        // 여기서는 "json" 기본으로 처리하며 xml이 들어오면 스킵(또는 확장 구현 가능)
        final String dataJsonString;
        if ("xml".equalsIgnoreCase(option)) {
            // 확장이 필요하면 org.json.XML.toJSONObject(body)로 변환 후 toString() 반환하면 됨.
            logger.warning("[SKIP] option=xml is not supported in this task yet. url=" + fullUrl);
            return null;
        } else {
            dataJsonString = parseToDataJsonString(body);
        }

        final String kafkaValue = buildKafkaValue(dataJsonString, objectId, twinId);
        if (isBlank(kafkaValue)) return null;

        final String kafkaKey = buildKafkaKey(objectId);
        if (isBlank(kafkaKey)) return null;

        return dataConvert(kafkaValue, kafkaKey);
    }

    /**
     * 공통: HTTP GET + retry + body 읽기
     */
    private String fetchHttpBodyWithRetry(final String fullUrl) {
        int retryCount = 0;

        while (retryCount < MAX_RETRY_COUNT) {
            if (!running) return null;
            BufferedReader br = null;

            try {
                currentConn = (HttpURLConnection) new URL(fullUrl).openConnection();
                currentConn.setConnectTimeout(Math.max(100, connectTimeoutMs));
                currentConn.setReadTimeout(Math.max(100, readTimeoutMs));

                int status = currentConn.getResponseCode();
                if (!isSuccessful(status)) {
                    logger.warning("[FAIL Response] status=" + status
                            + " msg=" + currentConn.getResponseMessage()
                            + " url=" + fullUrl);
                    retryCount++;
                    continue;
                }

                br = new BufferedReader(new InputStreamReader(currentConn.getInputStream(), "utf-8"));
                final StringBuilder sb = new StringBuilder();
                String line;
                while ((line = br.readLine()) != null) sb.append(line);

                final String body = sb.toString().trim();
                if (body.isEmpty()) {
                    logger.warning("[EMPTY BODY] 2xx but response body is empty. url=" + fullUrl);
                    return null;
                }
                return body;

            } catch (Exception e) {
                retryCount++;
                logger.warning("[REQUEST ERROR] retry=" + retryCount + " url=" + fullUrl + " err=" + e);

                // 간단 backoff
                if (!running) return null;
                try {
                    Thread.sleep(200L * retryCount);
                } catch (InterruptedException ie) {
                    Thread.currentThread().interrupt();
                    return null;
                }

            } finally {
                try { if (br != null) br.close(); } catch (Exception ignore) {}

                HttpURLConnection c = currentConn;
                currentConn = null;
                if (c != null) {
                    try { c.disconnect(); } catch (Exception ignore) {}
                }
            }
        }

        logger.warning("[MAX RETRY EXCEEDED] Failed to complete GET request. url=" + fullUrl);
        return null;
    }

    /**
     * JSON body -> data(JSON string) 정규화
     * - body가 JSON이 아니면 null 반환(=발행하지 않음)
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
     * 공통: 최종 value(payload) 조립
     */
    private String buildKafkaValue(final String dataJsonString, final String objectId, final String twinId) {
        if (isBlank(dataJsonString)) return null;

        final String trimmed = dataJsonString.trim();
        if (trimmed.isEmpty() || "{}".equals(trimmed)) {
            logger.warning("[SKIP] dataJsonString empty/{}. objectId=" + objectId);
            return null;
        }

        final Instant now = Instant.now();

        final JSONObject obj = new JSONObject();
        obj.put("digital_twin_id", twinId);
        obj.put(resourceName, objectId);
        obj.put("data", dataJsonString);
        obj.put("rowtime", now.atZone(ZoneOffset.UTC).format(FORMATTER));
        obj.put("location", "POINT EMPTY");

        return obj.toString();
    }

    /**
     * 공통: key 생성
     */
    private String buildKafkaKey(final String objectId) {
        if (isBlank(objectId)) return null;
        return new JSONObject().put(resourceName, objectId).toString();
    }

    protected SourceRecord dataConvert(String httpMessage, String strkafkaKey) {
        ConnectHeaders headers = new ConnectHeaders();
        return new SourceRecord(
                new HashMap<>(),
                new HashMap<>(),
                keyTopic,
                (Integer) null,
                Schema.STRING_SCHEMA,
                strkafkaKey,
                Schema.STRING_SCHEMA,
                httpMessage,
                System.currentTimeMillis(),
                headers
        );
    }

    @Override
    public void stop() {
        running = false;

        Thread t = pollThread;
        pollThread = null;

        HttpURLConnection c = currentConn;
        currentConn = null;

        if (c != null) {
            try { c.disconnect(); } catch (Exception ignore) {}
        }
        if (t != null) t.interrupt();

        logger.info(() -> String.format(
            "[STOP] connector=%s worker=%s task=%d/%d urls=%s",
            connectorName, workerId, taskIndex, taskCount, changeUrls
        ));
    }

    // -----------------------
    // Utilities
    // -----------------------

    private static boolean isBlank(String s) {
        return s == null || s.trim().isEmpty();
    }

    private static String requireNonBlank(String v, String key) {
        if (v == null || v.trim().isEmpty()) {
            throw new ConnectException("Missing required config: " + key);
        }
        return v;
    }

    private static String nonBlankOrDefault(String v, String def) {
        return isBlank(v) ? def : v;
    }

    private static List<String> safeList(List<String> list) {
        return list == null ? new ArrayList<>() : list;
    }

    /**
     * i번째에 해당하는 값을 순환 선택 (list가 비어있으면 null)
     */
    private static String pickCyclic(List<String> list, int index) {
        if (list == null || list.isEmpty()) return null;
        return list.get(index % list.size());
    }

    /**
     * URL join: 슬래시 중복/누락 정확히 처리
     */
    private static String joinUrl(String base, String path) {
        if (base == null) return path;
        if (path == null || path.isEmpty()) return base;

        final boolean baseEnds = base.endsWith("/");
        final boolean pathStarts = path.startsWith("/");

        if (baseEnds && pathStarts) return base + path.substring(1);
        if (!baseEnds && !pathStarts) return base + "/" + path;
        return base + path;
    }

    private static String safeShort(String s) {
        if (s == null) return null;
        final String t = s.trim();
        return t.length() > 300 ? t.substring(0, 300) + "..." : t;
    }
}
