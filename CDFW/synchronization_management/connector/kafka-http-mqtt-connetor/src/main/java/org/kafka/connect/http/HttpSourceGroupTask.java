package org.kafka.connect.http;

import org.apache.kafka.connect.data.Schema;
import org.apache.kafka.connect.errors.ConnectException;
import org.apache.kafka.connect.header.ConnectHeaders;
import org.apache.kafka.connect.source.SourceRecord;
import org.apache.kafka.connect.source.SourceTask;
import org.json.JSONException;
import org.json.JSONObject;

import javax.net.ssl.SSLException;
import javax.ws.rs.core.Response;
import java.io.BufferedReader;
import java.io.EOFException;
import java.io.IOException;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.SocketTimeoutException;
import java.net.URL;
import java.net.UnknownHostException;
import java.time.Instant;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.logging.Logger;

public class HttpSourceGroupTask extends SourceTask {
    Logger logger = Logger.getLogger("HttpSourceGroupLogs");

    URL url;
    HttpURLConnection conn;
    BufferedReader br;
    HttpSourceGroupConnectorConfig config;
    String option;
    Instant now;
    DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss.SSS");
    int MAX_RETRY_COUNT = 3;
    private static final int MAX_REDIRECT_COUNT = 5;
    private String key_topic;
    private String connectorName;

    @Override
    public String version() {
        return "1.0";
    }

    @Override
    public void start(Map<String, String> props) {
        config = new HttpSourceGroupConnectorConfig(props);
        connectorName = props.get("name");
        option = config.getString("data.source.format");
        key_topic = config.getString("kafka.topic");

        logger.info("Starting HttpSourceGroupConnector with connector name: " + connectorName);
        logger.info("HttpSourceGroupTask config setting : " + props.toString());
    }

    private boolean isInvalidUrl(String url) {
        return url == null || url.trim().isEmpty() || "null".equalsIgnoreCase(url.trim());
    }

    private String normalizeUrl(String url) {
        if (isInvalidUrl(url)) {
            return url;
        }
        return url.trim();
    }

    private boolean hasScheme(String url) {
        if (isInvalidUrl(url)) {
            return false;
        }

        String lower = url.trim().toLowerCase();
        return lower.startsWith("http://") || lower.startsWith("https://");
    }

    private String switchScheme(String url) {
        if (isInvalidUrl(url)) {
            return url;
        }

        String trimmed = url.trim();
        String lower = trimmed.toLowerCase();

        if (lower.startsWith("http://")) {
            return "https://" + trimmed.substring("http://".length());
        } else if (lower.startsWith("https://")) {
            return "http://" + trimmed.substring("https://".length());
        }

        return trimmed;
    }

    private List<String> buildCandidateUrls(String rawUrl) {
        Set<String> candidates = new LinkedHashSet<>();

        if (isInvalidUrl(rawUrl)) {
            return new ArrayList<>();
        }

        String trimmed = normalizeUrl(rawUrl);

        if (hasScheme(trimmed)) {
            candidates.add(trimmed);

            String switched = switchScheme(trimmed);
            if (!trimmed.equals(switched)) {
                candidates.add(switched);
            }
        } else {
            candidates.add("https://" + trimmed);
            candidates.add("http://" + trimmed);
        }

        return new ArrayList<>(candidates);
    }

    private String buildFullUrl(String baseUrl, String changeUrl) {
        baseUrl = normalizeUrl(baseUrl);

        if (isInvalidUrl(baseUrl)) {
            return null;
        }

        if (changeUrl == null || changeUrl.trim().isEmpty()) {
            return baseUrl;
        }

        String b = baseUrl.trim();
        String c = changeUrl.trim();

        if (b.endsWith("/") && c.startsWith("/")) {
            return b + c.substring(1);
        } else if (!b.endsWith("/") && !c.startsWith("/")) {
            return b + "/" + c;
        } else {
            return b + c;
        }
    }

    private List<String> sanitizeList(List<String> rawList) {
        List<String> sanitized = new ArrayList<>();

        if (rawList == null) {
            return sanitized;
        }

        for (String item : rawList) {
            if (item != null) {
                String trimmed = item.trim();
                if (!trimmed.isEmpty() && !"null".equalsIgnoreCase(trimmed)) {
                    sanitized.add(trimmed);
                }
            }
        }

        return sanitized;
    }

    private HttpURLConnection openConnectionFollowingRedirects(String requestUrl) throws IOException {
        String currentUrl = normalizeUrl(requestUrl);

        for (int i = 0; i < MAX_REDIRECT_COUNT; i++) {
            HttpURLConnection connection = (HttpURLConnection) new URL(currentUrl).openConnection();
            connection.setInstanceFollowRedirects(false);
            connection.setRequestMethod("GET");
            connection.setConnectTimeout(5000);
            connection.setReadTimeout(10000);

            int status = connection.getResponseCode();

            if (status == HttpURLConnection.HTTP_MOVED_PERM ||
                status == HttpURLConnection.HTTP_MOVED_TEMP ||
                status == HttpURLConnection.HTTP_SEE_OTHER ||
                status == 307 ||
                status == 308) {

                String location = connection.getHeaderField("Location");
                logger.warning("[REDIRECT] " + currentUrl + " -> " + location);

                if (isInvalidUrl(location)) {
                    connection.disconnect();
                    throw new IOException("Redirect location is invalid: " + location);
                }

                URL current = new URL(currentUrl);
                URL resolved = new URL(current, location);
                connection.disconnect();

                currentUrl = normalizeUrl(resolved.toString());
                continue;
            }

            return connection;
        }

        throw new IOException("Too many redirects for URL: " + requestUrl);
    }

    private boolean isRetryWithAlternateSchemeAllowed(IOException e) {
        return e instanceof SSLException
                || e instanceof SocketTimeoutException
                || e instanceof java.net.ConnectException
                || e instanceof UnknownHostException
                || e instanceof EOFException;
    }

    private HttpURLConnection openConnectionWithSchemeFallback(String fullUrl) throws IOException {
        List<String> candidates = buildCandidateUrls(fullUrl);
        IOException lastException = null;

        if (candidates.isEmpty()) {
            throw new IOException("No candidate URLs available for: " + fullUrl);
        }

        for (int i = 0; i < candidates.size(); i++) {
            String candidate = candidates.get(i);

            try {
                logger.info("[HTTP TRY] connector=" + connectorName + ", url=" + candidate);
                HttpURLConnection connection = openConnectionFollowingRedirects(candidate);
                logger.info("[HTTP SUCCESS] connector=" + connectorName + ", url=" + candidate);
                return connection;
            } catch (IOException e) {
                lastException = e;
                logger.warning("[HTTP FAIL] connector=" + connectorName + ", url=" + candidate + ", error=" + e);

                if (i == 0 && candidates.size() > 1 && !isRetryWithAlternateSchemeAllowed(e)) {
                    break;
                }
            }
        }

        throw lastException != null ? lastException : new IOException("Failed to connect: " + fullUrl);
    }

    private String sendHttpGetRequest(String fullUrl, String objectId, String twinId) throws IOException {
        int retryCount = 0;
        boolean success = false;
        String strHttpData = "";

        fullUrl = normalizeUrl(fullUrl);

        if (isInvalidUrl(fullUrl)) {
            logger.warning("[INVALID URL] fullUrl is invalid: " + fullUrl);
            return "";
        }

        while (retryCount < MAX_RETRY_COUNT && !success) {
            HttpURLConnection localConn = null;
            BufferedReader localBr = null;

            try {
                localConn = openConnectionWithSchemeFallback(fullUrl);
                int status = localConn.getResponseCode();

                if (Response.Status.Family.familyOf(status) != Response.Status.Family.SUCCESSFUL) {
                    logger.warning("[FAIL RESPONSE] GET: status=" + status
                            + ", message=" + localConn.getResponseMessage()
                            + ", url=" + fullUrl);
                    retryCount++;
                } else {
                    localBr = new BufferedReader(new InputStreamReader(localConn.getInputStream(), "utf-8"));
                    StringBuilder sb = new StringBuilder();
                    String responseData;

                    while ((responseData = localBr.readLine()) != null) {
                        sb.append(responseData);
                    }

                    now = Instant.now();
                    JSONObject httpDataObj = new JSONObject();
                    String httpData = sb.toString();

                    try {
                        JSONObject jsonNode = new JSONObject(httpData);
                        httpDataObj.put("data", jsonNode.toString());
                    } catch (Exception e) {
                        logger.warning(e + "\n[TypeError] not a json object: " + httpData);
                        httpDataObj.put("data", httpData);
                    }

                    httpDataObj.put("digital_twin_id", twinId);
                    httpDataObj.put("rowtime", now.atZone(ZoneOffset.UTC).format(formatter));
                    httpDataObj.put("location", "POINT EMPTY");
                    httpDataObj.put("digital_object_id", objectId);

                    strHttpData = httpDataObj.toString();
                    success = true;
                }
            } catch (IOException | JSONException e) {
                logger.warning("[ERROR] " + e);
                retryCount++;
            } finally {
                if (localBr != null) {
                    try {
                        localBr.close();
                    } catch (IOException ignored) {
                    }
                }
                if (localConn != null) {
                    localConn.disconnect();
                }
            }
        }

        if (!success) {
            logger.warning("Max retry count exceeded. Failed to complete GET request.");
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
            String baseUrl = config.getString("api.base.url");
            List<String> changeUrls = sanitizeList(config.getList("api.change.url"));
            List<String> objectIds = sanitizeList(config.getList("digital.object.id"));
            List<String> twinIds = sanitizeList(config.getList("digital.twin.id"));

            logger.info("[POLL CONFIG] connector=" + connectorName
                    + ", baseUrl=" + baseUrl
                    + ", changeUrls=" + changeUrls
                    + ", objectIds=" + objectIds
                    + ", twinIds=" + twinIds);

            if (isInvalidUrl(baseUrl)) {
                logger.warning("[CONFIG ERROR] api.base.url is invalid: " + baseUrl);
                return records;
            }

            if (objectIds.isEmpty()) {
                logger.warning("[CONFIG ERROR] digital.object.id is empty");
                return records;
            }

            if (twinIds.isEmpty()) {
                logger.warning("[CONFIG ERROR] digital.twin.id is empty");
                return records;
            }

            if (changeUrls.isEmpty()) {
                String objectId = objectIds.get(0);
                String twinId = twinIds.get(0);
                String fullUrl = buildFullUrl(baseUrl, null);

                String data = sendHttpGetRequest(fullUrl, objectId, twinId);

                if (data == null || data.isEmpty()) {
                    logger.warning("[DATA NULL] There is something wrong with the data from URL: " + fullUrl);
                } else {
                    JSONObject kafkaKey = new JSONObject();
                    kafkaKey.put("digital_object_id", objectId);

                    String strKafkaKey = kafkaKey.toString();
                    records.add(dataConvert(data, strKafkaKey));
                }
            } else {
                for (int i = 0; i < changeUrls.size(); i++) {
                    String changeUrl = changeUrls.get(i);
                    String fullUrl = buildFullUrl(baseUrl, changeUrl);
                    String objectId = objectIds.get(i % objectIds.size());
                    String twinId = twinIds.get(i % twinIds.size());

                    if (isInvalidUrl(fullUrl)) {
                        logger.warning("[CONFIG ERROR] built fullUrl is invalid: baseUrl=" + baseUrl + ", changeUrl=" + changeUrl);
                        continue;
                    }

                    String data = sendHttpGetRequest(fullUrl, objectId, twinId);

                    if (data == null || data.isEmpty()) {
                        logger.warning("[DATA NULL] There is something wrong with the data from URL: " + fullUrl);
                    } else {
                        JSONObject kafkaKey = new JSONObject();
                        kafkaKey.put("digital_object_id", objectId);

                        String strKafkaKey = kafkaKey.toString();
                        records.add(dataConvert(data, strKafkaKey));
                    }
                }
            }

            return records;
        } catch (IOException e) {
            logger.warning("[poll try-catch Exception] " + e);
            throw new ConnectException(e);
        }
    }

    protected SourceRecord dataConvert(String httpMessage, String strKafkaKey) {
        ConnectHeaders headers = new ConnectHeaders();
        return new SourceRecord(
                new HashMap<>(),
                new HashMap<>(),
                key_topic,
                (Integer) null,
                Schema.STRING_SCHEMA,
                strKafkaKey,
                Schema.STRING_SCHEMA,
                httpMessage,
                System.currentTimeMillis(),
                headers
        );
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