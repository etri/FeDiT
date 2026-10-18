package com.federated.ontology.searchRule.dev.stresstest;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.file.*;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Slf4j
@Component
public class StressTestReportGenerator {

    private final ObjectMapper objectMapper;
    private String latestReportPath;

    public StressTestReportGenerator(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public String getLatestReportPath() {
        return latestReportPath;
    }

    public Map<String, Object> generateReport(Map<String, Object> fullSuiteResult) {
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd-HHmmss"));
        String baseName = "stress-test-" + timestamp;

        Path reportsDir = Paths.get("reports");
        try {
            Files.createDirectories(reportsDir);
        } catch (IOException e) {
            log.error("reports 디렉토리 생성 실패", e);
        }

        Path jsonPath = reportsDir.resolve(baseName + ".json");
        try {
            String json = objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(fullSuiteResult);
            Files.writeString(jsonPath, json);
            log.info("[Report] JSON 리포트 생성: {}", jsonPath.toAbsolutePath());
        } catch (IOException e) {
            log.error("JSON 리포트 생성 실패", e);
        }

        Path htmlPath = reportsDir.resolve(baseName + ".html");
        try {
            String html = buildHtml(fullSuiteResult, timestamp);
            Files.writeString(htmlPath, html);
            latestReportPath = htmlPath.toAbsolutePath().toString();
            log.info("[Report] HTML 리포트 생성: {}", latestReportPath);
        } catch (IOException e) {
            log.error("HTML 리포트 생성 실패", e);
        }

        Map<String, Object> reportInfo = new LinkedHashMap<>();
        reportInfo.put("jsonReport", jsonPath.toAbsolutePath().toString());
        reportInfo.put("htmlReport", htmlPath.toAbsolutePath().toString());
        reportInfo.put("timestamp", timestamp);
        return reportInfo;
    }

    public String getLatestReportHtml() {
        if (latestReportPath == null) return null;
        try {
            return Files.readString(Path.of(latestReportPath));
        } catch (IOException e) {
            log.error("리포트 읽기 실패: {}", latestReportPath, e);
            return null;
        }
    }

    @SuppressWarnings("unchecked")
    private String buildHtml(Map<String, Object> result, String timestamp) {
        Map<String, Object> stellio = (Map<String, Object>) result.getOrDefault("stellioTps", Map.of());
        Map<String, Object> neo4j = (Map<String, Object>) result.getOrDefault("neo4jBulkCompare", Map.of());
        Map<String, Object> kafka = (Map<String, Object>) result.getOrDefault("kafkaE2E", Map.of());
        List<Map<String, Object>> neo4jResults = (List<Map<String, Object>>) neo4j.getOrDefault("results", List.of());

        double stellioP95 = toDouble(stellio, "p95Ms");
        double neo4jMaxRate = neo4jResults.stream()
                .mapToDouble(r -> toDouble(r, "itemsPerSecond"))
                .max().orElse(0);
        long kafkaLatency = toLong(kafka, "e2eLatencyMs");

        String stellioVerdict = stellioP95 > 0 && stellioP95 < 500 ? "PASS" : (stellioP95 == 0 ? "N/A" : "FAIL");
        String neo4jVerdict = neo4jMaxRate > 100 ? "PASS" : (neo4jMaxRate == 0 ? "N/A" : "FAIL");
        String kafkaVerdict = kafkaLatency > 0 && kafkaLatency < 10000 ? "PASS" : (kafkaLatency == 0 ? "N/A" : "FAIL");

        StringBuilder sb = new StringBuilder();
        sb.append("<!DOCTYPE html>\n<html lang='ko'>\n<head>\n");
        sb.append("<meta charset='UTF-8'>\n");
        sb.append("<title>Stress Test Report - ").append(timestamp).append("</title>\n");
        sb.append("<script src='https://cdn.jsdelivr.net/npm/chart.js'></script>\n");
        sb.append("<style>\n");
        sb.append("body { font-family: 'Segoe UI', sans-serif; margin: 20px; background: #f5f5f5; }\n");
        sb.append(".container { max-width: 1200px; margin: 0 auto; }\n");
        sb.append("h1 { color: #333; border-bottom: 3px solid #2196F3; padding-bottom: 10px; }\n");
        sb.append("h2 { color: #1976D2; margin-top: 30px; }\n");
        sb.append(".card { background: white; border-radius: 8px; padding: 20px; margin: 15px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }\n");
        sb.append("table { width: 100%; border-collapse: collapse; margin: 10px 0; }\n");
        sb.append("th, td { padding: 10px 14px; text-align: left; border-bottom: 1px solid #e0e0e0; }\n");
        sb.append("th { background: #f5f5f5; font-weight: 600; }\n");
        sb.append(".pass { color: #4CAF50; font-weight: bold; }\n");
        sb.append(".fail { color: #f44336; font-weight: bold; }\n");
        sb.append(".na { color: #9e9e9e; }\n");
        sb.append(".verdict-box { display: flex; gap: 20px; margin: 20px 0; }\n");
        sb.append(".verdict-item { flex: 1; padding: 20px; border-radius: 8px; text-align: center; color: white; }\n");
        sb.append(".verdict-pass { background: #4CAF50; }\n");
        sb.append(".verdict-fail { background: #f44336; }\n");
        sb.append(".verdict-na { background: #9e9e9e; }\n");
        sb.append(".chart-container { width: 100%; max-width: 600px; margin: 20px auto; }\n");
        sb.append("</style>\n</head>\n<body>\n<div class='container'>\n");

        sb.append("<h1>Stress Test Report</h1>\n");
        sb.append("<p><strong>실행 시각:</strong> ").append(timestamp).append("</p>\n");
        sb.append("<p><strong>대상:</strong> Stellio ({stressTestIp}:8080) | Neo4j ({stressTestIp}:7687) | Kafka ({kafkaIp}:9092)</p>\n");

        sb.append("<h2>종합 판정</h2>\n");
        sb.append("<div class='verdict-box'>\n");
        sb.append(verdictItem("Stellio TPS", "p95 < 500ms", stellioVerdict));
        sb.append(verdictItem("Neo4j Bulk", "> 100 items/sec", neo4jVerdict));
        sb.append(verdictItem("Kafka E2E", "< 10s latency", kafkaVerdict));
        sb.append("</div>\n");

        sb.append("<h2>Scenario 1: Stellio Upsert TPS</h2>\n");
        sb.append("<div class='card'>\n");
        sb.append("<table>\n<tr><th>Metric</th><th>Value</th></tr>\n");
        sb.append(tableRow("Total Requests", stellio.getOrDefault("totalRequests", "-")));
        sb.append(tableRow("Success Count", stellio.getOrDefault("successCount", "-")));
        sb.append(tableRow("Fail Count", stellio.getOrDefault("failCount", "-")));
        sb.append(tableRow("Elapsed (ms)", stellio.getOrDefault("elapsedMs", "-")));
        sb.append(tableRow("TPS", String.format("%.2f", toDouble(stellio, "tps"))));
        sb.append(tableRow("p50 (ms)", stellio.getOrDefault("p50Ms", "-")));
        sb.append(tableRow("p95 (ms)", stellio.getOrDefault("p95Ms", "-")));
        sb.append(tableRow("p99 (ms)", stellio.getOrDefault("p99Ms", "-")));
        sb.append("</table>\n</div>\n");

        sb.append("<div class='card'><div class='chart-container'>\n");
        sb.append("<canvas id='stellioChart'></canvas>\n");
        sb.append("</div></div>\n");

        sb.append("<h2>Scenario 2: Neo4j Bulk Sync Performance</h2>\n");
        sb.append("<div class='card'>\n");
        sb.append("<table>\n<tr><th>Method</th><th>Batch Size</th><th>Elapsed (ms)</th><th>Items/sec</th><th>Saved</th></tr>\n");
        for (Map<String, Object> r : neo4jResults) {
            sb.append("<tr>");
            sb.append("<td>").append(r.getOrDefault("method", "-")).append("</td>");
            sb.append("<td>").append(r.getOrDefault("batchSize", "-")).append("</td>");
            sb.append("<td>").append(r.getOrDefault("elapsedMs", "-")).append("</td>");
            sb.append("<td>").append(String.format("%.1f", toDouble(r, "itemsPerSecond"))).append("</td>");
            sb.append("<td>").append(r.getOrDefault("savedCount", "-")).append("</td>");
            sb.append("</tr>\n");
        }
        sb.append("</table>\n</div>\n");

        sb.append("<div class='card'><div class='chart-container'>\n");
        sb.append("<canvas id='neo4jChart'></canvas>\n");
        sb.append("</div></div>\n");

        sb.append("<h2>Scenario 3: Kafka E2E Pipeline</h2>\n");
        sb.append("<div class='card'>\n");
        sb.append("<table>\n<tr><th>Metric</th><th>Value</th></tr>\n");
        sb.append(tableRow("Messages Sent", kafka.getOrDefault("messagesSent", "-")));
        sb.append(tableRow("Neo4j Synced", kafka.getOrDefault("neo4jSyncCount", "-")));
        sb.append(tableRow("E2E Latency (ms)", kafka.getOrDefault("e2eLatencyMs", "-")));
        sb.append(tableRow("Avg Latency/msg (ms)", kafka.getOrDefault("avgLatencyPerMsg", "-")));
        sb.append("</table>\n</div>\n");

        sb.append("<script>\n");

        sb.append("new Chart(document.getElementById('stellioChart'), {\n");
        sb.append("  type: 'bar',\n");
        sb.append("  data: {\n");
        sb.append("    labels: ['p50', 'p95', 'p99'],\n");
        sb.append("    datasets: [{ label: 'Latency (ms)', data: [");
        sb.append(toDouble(stellio, "p50Ms")).append(",");
        sb.append(toDouble(stellio, "p95Ms")).append(",");
        sb.append(toDouble(stellio, "p99Ms"));
        sb.append("], backgroundColor: ['#4CAF50','#FF9800','#f44336'] }]\n");
        sb.append("  },\n");
        sb.append("  options: { responsive: true, plugins: { title: { display: true, text: 'Stellio Upsert Latency Distribution' }}}\n");
        sb.append("});\n");

        List<String> ogmLabels = new ArrayList<>();
        List<String> ogmData = new ArrayList<>();
        List<String> cypherLabels = new ArrayList<>();
        List<String> cypherData = new ArrayList<>();
        for (Map<String, Object> r : neo4jResults) {
            String method = String.valueOf(r.getOrDefault("method", ""));
            String batchSize = String.valueOf(r.getOrDefault("batchSize", ""));
            String rate = String.valueOf(toDouble(r, "itemsPerSecond"));
            if ("OGM".equals(method)) {
                ogmLabels.add("'" + batchSize + "'");
                ogmData.add(rate);
            } else {
                cypherLabels.add("'" + batchSize + "'");
                cypherData.add(rate);
            }
        }
        sb.append("new Chart(document.getElementById('neo4jChart'), {\n");
        sb.append("  type: 'line',\n");
        sb.append("  data: {\n");
        sb.append("    labels: [").append(String.join(",", ogmLabels.isEmpty() ? cypherLabels : ogmLabels)).append("],\n");
        sb.append("    datasets: [\n");
        if (!ogmData.isEmpty()) {
            sb.append("      { label: 'OGM', data: [").append(String.join(",", ogmData)).append("], borderColor: '#2196F3', fill: false },\n");
        }
        if (!cypherData.isEmpty()) {
            sb.append("      { label: 'Cypher', data: [").append(String.join(",", cypherData)).append("], borderColor: '#FF9800', fill: false },\n");
        }
        sb.append("    ]\n");
        sb.append("  },\n");
        sb.append("  options: { responsive: true, plugins: { title: { display: true, text: 'Neo4j Bulk Save Performance (items/sec)' }}}\n");
        sb.append("});\n");

        sb.append("</script>\n");
        sb.append("</div>\n</body>\n</html>");

        return sb.toString();
    }

    private String verdictItem(String title, String criteria, String verdict) {
        String cssClass = switch (verdict) {
            case "PASS" -> "verdict-pass";
            case "FAIL" -> "verdict-fail";
            default -> "verdict-na";
        };
        return String.format("<div class='verdict-item %s'><h3>%s</h3><p>%s</p><p style='font-size:24px'>%s</p></div>\n",
                cssClass, title, criteria, verdict);
    }

    private String tableRow(String label, Object value) {
        return String.format("<tr><td>%s</td><td>%s</td></tr>\n", label, value);
    }

    private double toDouble(Map<String, Object> map, String key) {
        Object v = map.get(key);
        if (v instanceof Number n) return n.doubleValue();
        if (v instanceof String s) {
            try { return Double.parseDouble(s); } catch (NumberFormatException ignored) {}
        }
        return 0.0;
    }

    private long toLong(Map<String, Object> map, String key) {
        Object v = map.get(key);
        if (v instanceof Number n) return n.longValue();
        if (v instanceof String s) {
            try { return Long.parseLong(s); } catch (NumberFormatException ignored) {}
        }
        return 0L;
    }
}
