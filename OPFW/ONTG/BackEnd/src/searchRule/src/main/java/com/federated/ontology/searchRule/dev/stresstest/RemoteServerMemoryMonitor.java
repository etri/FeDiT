package com.federated.ontology.searchRule.dev.stresstest;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Slf4j
@Component
public class RemoteServerMemoryMonitor {

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Value("${spring.neo4j.uri}")
    private String neo4jBoltUri;

    @Value("${spring.neo4j.authentication.username}")
    private String neo4jUser;

    @Value("${spring.neo4j.authentication.password}")
    private String neo4jPassword;

    @Value("${stress-test.stellio.actuator-url:http://{stressTestIp}:8083}")
    private String stellioActuatorUrl;

    public RemoteServerMemoryMonitor(RestTemplate restTemplate, ObjectMapper objectMapper) {
        this.restTemplate = restTemplate;
        this.objectMapper = objectMapper;
    }

    @SuppressWarnings("unchecked")
    public Map<String, Object> getNeo4jHeapMemory() {
        Map<String, Object> result = new LinkedHashMap<>();
        try {
            Map<String, Object> jmx = queryJmx("java.lang:type=Memory");
            Map<String, Object> attrs = (Map<String, Object>) jmx.get("attributes");
            Map<String, Object> heapUsage = extractJmxValue(attrs, "HeapMemoryUsage");
            Map<String, Object> nonHeapUsage = extractJmxValue(attrs, "NonHeapMemoryUsage");

            if (heapUsage != null) {
                Map<String, Object> props = (Map<String, Object>) heapUsage.get("properties");
                long used = toLong(props.get("used"));
                long committed = toLong(props.get("committed"));
                long max = toLong(props.get("max"));

                result.put("heapUsedMB", used / 1024 / 1024);
                result.put("heapCommittedMB", committed / 1024 / 1024);
                result.put("heapMaxMB", max / 1024 / 1024);
                result.put("heapUsagePercent", max > 0 ? Math.round((double) used / max * 100 * 10) / 10.0 : 0);
            }

            if (nonHeapUsage != null) {
                Map<String, Object> props = (Map<String, Object>) nonHeapUsage.get("properties");
                long used = toLong(props.get("used"));
                long committed = toLong(props.get("committed"));
                result.put("nonHeapUsedMB", used / 1024 / 1024);
                result.put("nonHeapCommittedMB", committed / 1024 / 1024);
            }
        } catch (Exception e) {
            log.warn("[MemoryMonitor] Neo4j Heap 조회 실패: {}", e.getMessage());
            result.put("error", e.getMessage());
        }
        return result;
    }

    @SuppressWarnings("unchecked")
    public Map<String, Object> getServerOsMetrics() {
        Map<String, Object> result = new LinkedHashMap<>();
        try {
            Map<String, Object> jmx = queryJmx("java.lang:type=OperatingSystem");
            Map<String, Object> attrs = (Map<String, Object>) jmx.get("attributes");

            long totalMem = extractLongValue(attrs, "TotalPhysicalMemorySize");
            long freeMem = extractLongValue(attrs, "FreePhysicalMemorySize");
            long usedMem = totalMem - freeMem;

            result.put("totalMemoryMB", totalMem / 1024 / 1024);
            result.put("freeMemoryMB", freeMem / 1024 / 1024);
            result.put("usedMemoryMB", usedMem / 1024 / 1024);
            result.put("memoryUsagePercent", totalMem > 0 ? Math.round((double) usedMem / totalMem * 100 * 10) / 10.0 : 0);
            result.put("availableProcessors", extractLongValue(attrs, "AvailableProcessors"));
            result.put("systemCpuLoadPercent", Math.round(extractDoubleValue(attrs, "CpuLoad") * 100 * 10) / 10.0);
            result.put("processCpuLoadPercent", Math.round(extractDoubleValue(attrs, "ProcessCpuLoad") * 100 * 10) / 10.0);
            result.put("systemLoadAverage", extractDoubleValue(attrs, "SystemLoadAverage"));
        } catch (Exception e) {
            log.warn("[MemoryMonitor] OS 메트릭 조회 실패: {}", e.getMessage());
            result.put("error", e.getMessage());
        }
        return result;
    }

    @SuppressWarnings("unchecked")
    public Map<String, Object> getStellioMemory() {
        Map<String, Object> result = new LinkedHashMap<>();
        try {
            String usedUrl = stellioActuatorUrl + "/actuator/metrics/jvm.memory.used";
            String maxUrl = stellioActuatorUrl + "/actuator/metrics/jvm.memory.max";
            String cpuUrl = stellioActuatorUrl + "/actuator/metrics/process.cpu.usage";

            Map<String, Object> usedResp = restTemplate.getForObject(usedUrl, Map.class);
            Map<String, Object> maxResp = restTemplate.getForObject(maxUrl, Map.class);

            long usedBytes = extractActuatorValue(usedResp);
            long maxBytes = extractActuatorValue(maxResp);

            result.put("heapUsedMB", usedBytes / 1024 / 1024);
            result.put("heapMaxMB", maxBytes / 1024 / 1024);
            result.put("heapUsagePercent", maxBytes > 0 ? Math.round((double) usedBytes / maxBytes * 100 * 10) / 10.0 : 0);

            try {
                Map<String, Object> cpuResp = restTemplate.getForObject(cpuUrl, Map.class);
                double cpuUsage = extractActuatorDoubleValue(cpuResp);
                result.put("cpuUsagePercent", Math.round(cpuUsage * 100 * 10) / 10.0);
            } catch (Exception ignored) {}

        } catch (Exception e) {
            log.warn("[MemoryMonitor] Stellio Actuator 조회 실패: {}", e.getMessage());
            result.put("error", e.getMessage());
        }
        return result;
    }

    public Map<String, Object> takeSnapshot(String label) {
        Map<String, Object> snapshot = new LinkedHashMap<>();
        snapshot.put("label", label);
        snapshot.put("timestamp", System.currentTimeMillis());
        snapshot.put("neo4jHeap", getNeo4jHeapMemory());
        snapshot.put("stellioHeap", getStellioMemory());
        snapshot.put("serverOs", getServerOsMetrics());
        return snapshot;
    }

    @SuppressWarnings("unchecked")
    public Map<String, Object> calculateDelta(Map<String, Object> before, Map<String, Object> after) {
        Map<String, Object> delta = new LinkedHashMap<>();
        delta.put("beforeLabel", before.get("label"));
        delta.put("afterLabel", after.get("label"));

        Map<String, Object> heapBefore = (Map<String, Object>) before.get("neo4jHeap");
        Map<String, Object> heapAfter = (Map<String, Object>) after.get("neo4jHeap");
        Map<String, Object> osBefore = (Map<String, Object>) before.get("serverOs");
        Map<String, Object> osAfter = (Map<String, Object>) after.get("serverOs");

        if (heapBefore != null && heapAfter != null) {
            delta.put("neo4jHeapDeltaMB",
                    toLong(heapAfter.getOrDefault("heapUsedMB", 0)) - toLong(heapBefore.getOrDefault("heapUsedMB", 0)));
        }
        if (osBefore != null && osAfter != null) {
            delta.put("serverMemoryDeltaMB",
                    toLong(osAfter.getOrDefault("usedMemoryMB", 0)) - toLong(osBefore.getOrDefault("usedMemoryMB", 0)));
        }

        return delta;
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> queryJmx(String objectName) throws Exception {
        String neo4jHttpUrl = deriveHttpUrl();
        String url = neo4jHttpUrl + "/db/neo4j/tx/commit";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBasicAuth(neo4jUser, neo4jPassword);

        String body = "{\"statements\":[{\"statement\":\"CALL dbms.queryJmx(\\\"" + objectName + "\\\")\"}]}";
        HttpEntity<String> request = new HttpEntity<>(body, headers);

        ResponseEntity<Map> response = restTemplate.postForEntity(url, request, Map.class);
        Map<String, Object> responseBody = response.getBody();

        List<Map<String, Object>> results = (List<Map<String, Object>>) responseBody.get("results");
        List<Map<String, Object>> data = (List<Map<String, Object>>) results.get(0).get("data");
        List<Object> row = (List<Object>) data.get(0).get("row");

        Map<String, Object> jmxResult = new LinkedHashMap<>();
        jmxResult.put("name", row.get(0));
        jmxResult.put("description", row.get(1));
        jmxResult.put("attributes", row.get(2));
        return jmxResult;
    }

    private String deriveHttpUrl() {
        String host = neo4jBoltUri.replaceAll("bolt://", "").replaceAll(":.*", "");
        return "http://" + host + ":7474";
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> extractJmxValue(Map<String, Object> attrs, String key) {
        Map<String, Object> attr = (Map<String, Object>) attrs.get(key);
        if (attr == null) return null;
        return (Map<String, Object>) attr.get("value");
    }

    @SuppressWarnings("unchecked")
    private long extractLongValue(Map<String, Object> attrs, String key) {
        Map<String, Object> attr = (Map<String, Object>) attrs.get(key);
        if (attr == null) return 0;
        return toLong(attr.get("value"));
    }

    @SuppressWarnings("unchecked")
    private double extractDoubleValue(Map<String, Object> attrs, String key) {
        Map<String, Object> attr = (Map<String, Object>) attrs.get(key);
        if (attr == null) return 0;
        Object val = attr.get("value");
        if (val instanceof Number n) return n.doubleValue();
        return 0;
    }

    private long toLong(Object val) {
        if (val instanceof Number n) return n.longValue();
        if (val instanceof String s) {
            try { return Long.parseLong(s); } catch (NumberFormatException ignored) {}
        }
        return 0;
    }

    @SuppressWarnings("unchecked")
    private long extractActuatorValue(Map<String, Object> response) {
        if (response == null) return 0;
        List<Map<String, Object>> measurements = (List<Map<String, Object>>) response.get("measurements");
        if (measurements == null || measurements.isEmpty()) return 0;
        Object val = measurements.get(0).get("value");
        if (val instanceof Number n) return n.longValue();
        return 0;
    }

    @SuppressWarnings("unchecked")
    private double extractActuatorDoubleValue(Map<String, Object> response) {
        if (response == null) return 0;
        List<Map<String, Object>> measurements = (List<Map<String, Object>>) response.get("measurements");
        if (measurements == null || measurements.isEmpty()) return 0;
        Object val = measurements.get(0).get("value");
        if (val instanceof Number n) return n.doubleValue();
        return 0;
    }
}
