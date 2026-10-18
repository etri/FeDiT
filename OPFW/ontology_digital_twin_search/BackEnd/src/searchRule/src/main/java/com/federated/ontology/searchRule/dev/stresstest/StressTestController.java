package com.federated.ontology.searchRule.dev.stresstest;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.federated.ontology.searchRule.component.KafkaBatchProcessor;
import com.federated.ontology.searchRule.dto.kafkaDto.KafkaMessage;
import com.federated.ontology.searchRule.neo4j.sync.CypherBulkSyncService;
import com.federated.ontology.searchRule.neo4j.Neo4jRepositoryHolder;
import com.federated.ontology.searchRule.serviceImpl.ngsildClientServiceImpl.NgsiLdBrokerClient;
import com.federated.ontology.searchRule.serviceImpl.ngsildClientServiceImpl.NgsiLdTwinDataSource;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.http.MediaType;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.concurrent.*;
import java.util.stream.Collectors;

@Slf4j
@Profile("dev")
@RestController
@RequestMapping("/api/v1/dev/stress-tests")
public class StressTestController {

    private final NgsiLdBrokerClient brokerClient;
    private final CypherBulkSyncService cypherBulkSyncService;
    private final Neo4jRepositoryHolder neo4jRepos;
    private final ObjectMapper objectMapper;
    private final StressTestDataGenerator dataGenerator;
    private final StressTestReportGenerator reportGenerator;
    private final RemoteServerMemoryMonitor memoryMonitor;
    private final KafkaBatchProcessor batchProcessor;
    private final NgsiLdTwinDataSource twinDataSource;
    private final KafkaTemplate<String, String> kafkaTemplate;

    @Value("${app.kafka.topic.searchRule}")
    private String kafkaTopic;

    public StressTestController(NgsiLdBrokerClient brokerClient,
                                 CypherBulkSyncService cypherBulkSyncService,
                                 Neo4jRepositoryHolder neo4jRepos,
                                 ObjectMapper objectMapper,
                                 StressTestDataGenerator dataGenerator,
                                 StressTestReportGenerator reportGenerator,
                                 RemoteServerMemoryMonitor memoryMonitor,
                                 KafkaBatchProcessor batchProcessor,
                                 NgsiLdTwinDataSource twinDataSource,
                                 KafkaTemplate<String, String> kafkaTemplate) {
        this.brokerClient = brokerClient;
        this.cypherBulkSyncService = cypherBulkSyncService;
        this.neo4jRepos = neo4jRepos;
        this.objectMapper = objectMapper;
        this.dataGenerator = dataGenerator;
        this.reportGenerator = reportGenerator;
        this.memoryMonitor = memoryMonitor;
        this.batchProcessor = batchProcessor;
        this.twinDataSource = twinDataSource;
        this.kafkaTemplate = kafkaTemplate;
    }

    @PostMapping("/runs/stellio-tps")
    public Map<String, Object> testStellioTps(@RequestBody(required = false) Map<String, Object> body) {
        int count = body != null && body.get("count") instanceof Number n ? n.intValue() : 100;
        int concurrency = body != null && body.get("concurrency") instanceof Number c ? c.intValue() : 4;

        log.info("[StressTest] Stellio TPS 테스트 시작. count={}, concurrency={}", count, concurrency);
        String prefix = dataGenerator.generatePrefix();
        List<String> dtids = dataGenerator.generateDtids(count, prefix);

        ExecutorService executor = Executors.newFixedThreadPool(concurrency);
        List<Long> latencies = Collections.synchronizedList(new ArrayList<>());
        int[] successFail = {0, 0};
        Object lock = new Object();

        long startTime = System.currentTimeMillis();

        List<Future<?>> futures = new ArrayList<>();
        for (int i = 0; i < count; i++) {
            final int idx = i;
            final String dtid = dtids.get(i);
            futures.add(executor.submit(() -> {
                long reqStart = System.nanoTime();
                try {
                    String json = dataGenerator.generateNgsiLdEntityJson(dtid, idx);
                    brokerClient.saveNgsiLdEntity(json);
                    long elapsed = (System.nanoTime() - reqStart) / 1_000_000;
                    latencies.add(elapsed);
                    synchronized (lock) { successFail[0]++; }
                } catch (Exception e) {
                    long elapsed = (System.nanoTime() - reqStart) / 1_000_000;
                    latencies.add(elapsed);
                    synchronized (lock) { successFail[1]++; }
                    log.warn("[StressTest] Stellio upsert 실패: dtid={}", dtid, e);
                }
            }));
        }

        for (Future<?> f : futures) {
            try { f.get(60, TimeUnit.SECONDS); } catch (Exception e) { log.warn("Future timeout", e); }
        }
        executor.shutdown();

        long totalElapsed = System.currentTimeMillis() - startTime;

        List<Long> sorted = latencies.stream().sorted().collect(Collectors.toList());
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("scenario", "Stellio Upsert TPS");
        result.put("totalRequests", count);
        result.put("concurrency", concurrency);
        result.put("successCount", successFail[0]);
        result.put("failCount", successFail[1]);
        result.put("elapsedMs", totalElapsed);
        result.put("tps", totalElapsed > 0 ? (double) count / totalElapsed * 1000 : 0);
        result.put("avgMs", sorted.isEmpty() ? 0 : sorted.stream().mapToLong(l -> l).average().orElse(0));
        result.put("p50Ms", percentile(sorted, 50));
        result.put("p95Ms", percentile(sorted, 95));
        result.put("p99Ms", percentile(sorted, 99));

        log.info("[StressTest] Stellio TPS 결과: {}ms, TPS={}, success={}, fail={}",
                totalElapsed, result.get("tps"), successFail[0], successFail[1]);

        return result;
    }

    @PostMapping("/runs/neo4j-bulk")
    public Map<String, Object> testNeo4jBulk(@RequestBody(required = false) Map<String, Object> body) {
        int batchSize = body != null && body.get("batchSize") instanceof Number n ? n.intValue() : 100;
        String method = body != null && body.get("method") instanceof String s ? s : "ogm";
        return runNeo4jBulk(batchSize, method);
    }

    private Map<String, Object> runNeo4jBulk(int batchSize, String method) {
        log.info("[StressTest] Neo4j 벌크 테스트 시작. batchSize={}, method={}", batchSize, method);
        String prefix = dataGenerator.generatePrefix();

        long startTime = System.currentTimeMillis();
        int savedCount;

        if ("cypher".equalsIgnoreCase(method)) {
            List<Map<String, Object>> metadata = dataGenerator.generateTwinMetadata(batchSize, prefix);
            savedCount = cypherBulkSyncService.syncFromMetadataList(metadata, List.of());
        } else {
            List<Map<String, Object>> metadata = dataGenerator.generateTwinMetadata(batchSize, prefix);
            savedCount = cypherBulkSyncService.syncFromMetadataList(metadata, List.of());
        }

        long elapsed = System.currentTimeMillis() - startTime;

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("scenario", "Neo4j Bulk Sync");
        result.put("method", method.toUpperCase());
        result.put("batchSize", batchSize);
        result.put("savedCount", savedCount);
        result.put("elapsedMs", elapsed);
        result.put("avgMsPerItem", batchSize > 0 ? (double) elapsed / batchSize : 0);
        result.put("itemsPerSecond", elapsed > 0 ? (double) savedCount / elapsed * 1000 : 0);
        result.put("neo4jTwinCount", neo4jRepos.getTwinRepository().count());
        result.put("neo4jSubjectTermCount", neo4jRepos.getSubjectTermRepository().count());
        result.put("neo4jKeywordTermCount", neo4jRepos.getKeywordTermRepository().count());

        log.info("[StressTest] Neo4j 벌크 결과: method={}, {}ms, {} items/sec",
                method, elapsed, result.get("itemsPerSecond"));
        return result;
    }

    @PostMapping("/runs/neo4j-bulk-compare")
    @SuppressWarnings("unchecked")
    public Map<String, Object> testNeo4jBulkCompare(@RequestBody(required = false) Map<String, Object> body) {
        List<Integer> sizeList;
        if (body != null && body.get("sizes") instanceof List<?> raw) {
            sizeList = ((List<Object>) raw).stream()
                    .map(o -> o instanceof Number n ? n.intValue() : Integer.parseInt(o.toString()))
                    .toList();
        } else {
            sizeList = List.of(50, 100, 500, 1000);
        }

        log.info("[StressTest] Neo4j 벌크 비교 테스트 시작. sizes={}", sizeList);

        List<Map<String, Object>> results = new ArrayList<>();
        for (int size : sizeList) {
            results.add(runNeo4jBulk(size, "ogm"));
        }

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("scenario", "Neo4j Bulk Compare");
        response.put("sizes", sizeList);
        response.put("results", results);
        return response;
    }

    @PostMapping("/runs/pipeline")
    public Map<String, Object> testPipeline(@RequestBody(required = false) Map<String, Object> body) {
        int count = body != null && body.get("count") instanceof Number n ? n.intValue() : 50;
        return runPipeline(count);
    }

    private Map<String, Object> runPipeline(int count) {
        log.info("[StressTest] Pipeline 테스트 시작. count={}", count);
        String prefix = dataGenerator.generatePrefix();

        long startTime = System.currentTimeMillis();

        List<KafkaMessage> messages = dataGenerator.generateKafkaMessages(count, prefix);
        Map<String, Object> timing = batchProcessor.processBatch(messages);

        long totalElapsed = System.currentTimeMillis() - startTime;

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("scenario", "Stellio + Neo4j Pipeline");
        result.put("count", count);
        result.put("totalElapsedMs", totalElapsed);
        result.put("timing", timing);

        log.info("[StressTest] Pipeline 결과: count={}, stellio={}ms, neo4j={}ms, total={}ms",
                count, timing.get("stellioElapsedMs"), timing.get("neo4jElapsedMs"), totalElapsed);
        return result;
    }

    @GetMapping("/memory")
    public Map<String, Object> getServerMemory() {
        return memoryMonitor.takeSnapshot("현재 상태");
    }

    @GetMapping("/memory/stats")
    public Map<String, Object> memoryStats(
            @RequestParam(defaultValue = "10") int seconds) throws InterruptedException {

        log.info("[StressTest] 메모리 통계 수집 시작. {}초 샘플링", seconds);

        List<Map<String, Object>> neo4jSamples = Collections.synchronizedList(new ArrayList<>());
        List<Map<String, Object>> stellioSamples = Collections.synchronizedList(new ArrayList<>());

        ScheduledExecutorService sampler = Executors.newSingleThreadScheduledExecutor();
        sampler.scheduleAtFixedRate(() -> {
            neo4jSamples.add(memoryMonitor.getNeo4jHeapMemory());
            stellioSamples.add(memoryMonitor.getStellioMemory());
        }, 0, 500, TimeUnit.MILLISECONDS);

        Thread.sleep(seconds * 1000L);
        sampler.shutdown();

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("samplingSeconds", seconds);
        result.put("sampleCount", neo4jSamples.size());

        Map<String, Object> neo4j = new LinkedHashMap<>();
        neo4j.put("avgMB", Math.round(neo4jSamples.stream()
                .mapToLong(s -> toLongSafe(s, "heapUsedMB")).average().orElse(0) * 10) / 10.0);
        neo4j.put("maxMB", neo4jSamples.stream()
                .mapToLong(s -> toLongSafe(s, "heapUsedMB")).max().orElse(0));
        neo4j.put("maxAllocatedMB", neo4jSamples.stream()
                .mapToLong(s -> toLongSafe(s, "heapMaxMB")).max().orElse(0));
        result.put("neo4j", neo4j);

        Map<String, Object> stellio = new LinkedHashMap<>();
        stellio.put("avgMB", Math.round(stellioSamples.stream()
                .mapToLong(s -> toLongSafe(s, "heapUsedMB")).average().orElse(0) * 10) / 10.0);
        stellio.put("maxMB", stellioSamples.stream()
                .mapToLong(s -> toLongSafe(s, "heapUsedMB")).max().orElse(0));
        stellio.put("maxAllocatedMB", stellioSamples.stream()
                .mapToLong(s -> toLongSafe(s, "heapMaxMB")).max().orElse(0));
        result.put("stellio", stellio);

        log.info("[StressTest] 메모리 통계: Neo4j avg={}MB max={}MB, Stellio avg={}MB max={}MB",
                neo4j.get("avgMB"), neo4j.get("maxMB"), stellio.get("avgMB"), stellio.get("maxMB"));
        return result;
    }

    @GetMapping("/memory/profile")
    public Map<String, Object> memoryProfile(
            @RequestParam(defaultValue = "100") int count) throws Exception {

        log.info("[StressTest] 메모리 프로파일링 시작. count={}", count);

        Map<String, Object> result = new LinkedHashMap<>();
        List<Map<String, Object>> snapshots = new ArrayList<>();

        Map<String, Object> initial = memoryMonitor.takeSnapshot("초기 상태");
        snapshots.add(initial);
        result.put("initial", initial);

        Map<String, Object> beforeStellio = memoryMonitor.takeSnapshot("Stellio 테스트 전");
        snapshots.add(beforeStellio);
        List<Map<String, Object>> stellioNeo4jSamples = new ArrayList<>();
        List<Map<String, Object>> stellioStellioSamples = new ArrayList<>();
        try {
            String prefix = dataGenerator.generatePrefix();
            List<String> dtids = dataGenerator.generateDtids(count, prefix);
            ExecutorService executor = Executors.newFixedThreadPool(4);

            List<Map<String, Object>> neo4jSamples = Collections.synchronizedList(new ArrayList<>());
            List<Map<String, Object>> stSamples = Collections.synchronizedList(new ArrayList<>());
            ScheduledExecutorService sampler = Executors.newSingleThreadScheduledExecutor();
            sampler.scheduleAtFixedRate(() -> {
                neo4jSamples.add(memoryMonitor.getNeo4jHeapMemory());
                stSamples.add(memoryMonitor.getStellioMemory());
            }, 0, 500, TimeUnit.MILLISECONDS);

            for (int i = 0; i < count; i++) {
                final int idx = i;
                final String dtid = dtids.get(i);
                executor.submit(() -> {
                    try {
                        String json = dataGenerator.generateNgsiLdEntityJson(dtid, idx);
                        brokerClient.saveNgsiLdEntity(json);
                    } catch (Exception ignored) {}
                });
            }
            executor.shutdown();
            executor.awaitTermination(60, TimeUnit.SECONDS);
            sampler.shutdown();
            stellioNeo4jSamples.addAll(neo4jSamples);
            stellioStellioSamples.addAll(stSamples);

        } catch (Exception e) {
            log.warn("[StressTest] Stellio 메모리 프로파일 실패", e);
        }
        Map<String, Object> afterStellio = memoryMonitor.takeSnapshot("Stellio 테스트 후");
        snapshots.add(afterStellio);
        result.put("stellio_neo4jMemory", buildMemoryStats("Stellio TPS - Neo4j", beforeStellio, afterStellio, stellioNeo4jSamples, "neo4jHeap"));
        result.put("stellio_stellioMemory", buildMemoryStats("Stellio TPS - Stellio", beforeStellio, afterStellio, stellioStellioSamples, "stellioHeap"));

        Map<String, Object> beforeNeo4j = memoryMonitor.takeSnapshot("Neo4j 테스트 전");
        snapshots.add(beforeNeo4j);
        List<Map<String, Object>> neo4jNeo4jSamples = new ArrayList<>();
        List<Map<String, Object>> neo4jStellioSamples = new ArrayList<>();
        try {
            String prefix = dataGenerator.generatePrefix();
            List<Map<String, Object>> metadata = dataGenerator.generateTwinMetadata(count, prefix);

            List<Map<String, Object>> n4jSamples = Collections.synchronizedList(new ArrayList<>());
            List<Map<String, Object>> stSamples = Collections.synchronizedList(new ArrayList<>());
            ScheduledExecutorService sampler = Executors.newSingleThreadScheduledExecutor();
            sampler.scheduleAtFixedRate(() -> {
                n4jSamples.add(memoryMonitor.getNeo4jHeapMemory());
                stSamples.add(memoryMonitor.getStellioMemory());
            }, 0, 500, TimeUnit.MILLISECONDS);

            cypherBulkSyncService.syncFromMetadataList(metadata, List.of());

            sampler.shutdown();
            neo4jNeo4jSamples.addAll(n4jSamples);
            neo4jStellioSamples.addAll(stSamples);
        } catch (Exception e) {
            log.warn("[StressTest] Neo4j 메모리 프로파일 실패", e);
        }
        Map<String, Object> afterNeo4j = memoryMonitor.takeSnapshot("Neo4j 테스트 후");
        snapshots.add(afterNeo4j);
        result.put("neo4j_neo4jMemory", buildMemoryStats("Neo4j Bulk - Neo4j", beforeNeo4j, afterNeo4j, neo4jNeo4jSamples, "neo4jHeap"));
        result.put("neo4j_stellioMemory", buildMemoryStats("Neo4j Bulk - Stellio", beforeNeo4j, afterNeo4j, neo4jStellioSamples, "stellioHeap"));

        Map<String, Object> beforePipeline = memoryMonitor.takeSnapshot("Pipeline 전");
        snapshots.add(beforePipeline);
        List<Map<String, Object>> pipelineNeo4jSamples = new ArrayList<>();
        List<Map<String, Object>> pipelineStellioSamples = new ArrayList<>();
        try {
            String prefix = dataGenerator.generatePrefix();

            List<Map<String, Object>> n4jSamples = Collections.synchronizedList(new ArrayList<>());
            List<Map<String, Object>> stSamples = Collections.synchronizedList(new ArrayList<>());
            ScheduledExecutorService sampler = Executors.newSingleThreadScheduledExecutor();
            sampler.scheduleAtFixedRate(() -> {
                n4jSamples.add(memoryMonitor.getNeo4jHeapMemory());
                stSamples.add(memoryMonitor.getStellioMemory());
            }, 0, 1000, TimeUnit.MILLISECONDS);

            List<KafkaMessage> messages = dataGenerator.generateKafkaMessages(50, prefix);
            batchProcessor.processBatch(messages);

            sampler.shutdown();
            pipelineNeo4jSamples.addAll(n4jSamples);
            pipelineStellioSamples.addAll(stSamples);
        } catch (Exception e) {
            log.warn("[StressTest] Pipeline 메모리 프로파일 실패", e);
        }
        Map<String, Object> afterPipeline = memoryMonitor.takeSnapshot("Pipeline 후");
        snapshots.add(afterPipeline);
        result.put("pipeline_neo4jMemory", buildMemoryStats("Pipeline - Neo4j", beforePipeline, afterPipeline, pipelineNeo4jSamples, "neo4jHeap"));
        result.put("pipeline_stellioMemory", buildMemoryStats("Pipeline - Stellio", beforePipeline, afterPipeline, pipelineStellioSamples, "stellioHeap"));

        result.put("serverOsSummary", afterPipeline.get("serverOs"));
        result.put("allSnapshots", snapshots);

        log.info("[StressTest] 메모리 프로파일링 완료");
        return result;
    }

    @PostMapping("/runs/full-suite")
    public Map<String, Object> runFullSuite(@RequestBody(required = false) Map<String, Object> body) throws Exception {
        int count = body != null && body.get("count") instanceof Number n ? n.intValue() : 100;

        log.info("[StressTest] Full Suite 실행 시작. count={}", count);

        Map<String, Object> fullResult = new LinkedHashMap<>();
        fullResult.put("startTime", System.currentTimeMillis());
        fullResult.put("requestedCount", count);

        fullResult.put("memoryBefore", memoryMonitor.takeSnapshot("Full Suite 시작 전"));

        List<Map<String, Object>> allNeo4jSamples = Collections.synchronizedList(new ArrayList<>());
        List<Map<String, Object>> allStellioSamples = Collections.synchronizedList(new ArrayList<>());
        ScheduledExecutorService memorySampler = Executors.newSingleThreadScheduledExecutor();
        memorySampler.scheduleAtFixedRate(() -> {
            allNeo4jSamples.add(memoryMonitor.getNeo4jHeapMemory());
            allStellioSamples.add(memoryMonitor.getStellioMemory());
        }, 0, 500, TimeUnit.MILLISECONDS);

        try {
            fullResult.put("neo4jBulk", runPipeline(count));
        } catch (Exception e) {
            fullResult.put("neo4jBulk", Map.of("error", e.toString()));
            log.error("[StressTest] Neo4j 벌크 테스트 실패", e);
        }

        memorySampler.shutdown();

        Map<String, Object> memAfter = memoryMonitor.takeSnapshot("Full Suite 완료 후");
        fullResult.put("memoryAfter", memAfter);
        fullResult.put("memoryDelta", memoryMonitor.calculateDelta(
                (Map<String, Object>) fullResult.get("memoryBefore"), memAfter));

        Map<String, Object> memoryStats = new LinkedHashMap<>();
        memoryStats.put("sampleCount", allNeo4jSamples.size());

        Map<String, Object> neo4jStats = new LinkedHashMap<>();
        neo4jStats.put("avgMB", Math.round(allNeo4jSamples.stream()
                .mapToLong(s -> toLongSafe(s, "heapUsedMB")).average().orElse(0) * 10) / 10.0);
        neo4jStats.put("maxMB", allNeo4jSamples.stream()
                .mapToLong(s -> toLongSafe(s, "heapUsedMB")).max().orElse(0));
        neo4jStats.put("maxAllocatedMB", allNeo4jSamples.stream()
                .mapToLong(s -> toLongSafe(s, "heapMaxMB")).max().orElse(0));
        memoryStats.put("neo4j", neo4jStats);

        Map<String, Object> stellioStats = new LinkedHashMap<>();
        stellioStats.put("avgMB", Math.round(allStellioSamples.stream()
                .mapToLong(s -> toLongSafe(s, "heapUsedMB")).average().orElse(0) * 10) / 10.0);
        stellioStats.put("maxMB", allStellioSamples.stream()
                .mapToLong(s -> toLongSafe(s, "heapUsedMB")).max().orElse(0));
        stellioStats.put("maxAllocatedMB", allStellioSamples.stream()
                .mapToLong(s -> toLongSafe(s, "heapMaxMB")).max().orElse(0));
        memoryStats.put("stellio", stellioStats);

        fullResult.put("memoryDuringTest", memoryStats);

        fullResult.put("endTime", System.currentTimeMillis());
        fullResult.put("totalDurationMs",
                (long) fullResult.get("endTime") - (long) fullResult.get("startTime"));

        Map<String, Object> reportInfo = reportGenerator.generateReport(fullResult);
        fullResult.put("reportInfo", reportInfo);

        log.info("[StressTest] Full Suite 완료. totalDuration={}ms | Neo4j avg={}MB max={}MB | Stellio avg={}MB max={}MB",
                fullResult.get("totalDurationMs"),
                neo4jStats.get("avgMB"), neo4jStats.get("maxMB"),
                stellioStats.get("avgMB"), stellioStats.get("maxMB"));
        return fullResult;
    }

    @GetMapping(value = "/reports/latest", produces = MediaType.TEXT_HTML_VALUE)
    @ResponseBody
    public String getLatestReport() {
        String html = reportGenerator.getLatestReportHtml();
        if (html == null) {
            return "<html><body><h1>No report available</h1><p>Run /api/stress-test/full-suite first.</p></body></html>";
        }
        return html;
    }

    @DeleteMapping(path = "/data", params = "!source")
    public Map<String, Object> cleanup() {
        log.info("[StressTest] Cleanup 시작");
        clearNeo4j();
        return Map.of("status", "CLEANED", "message", "Neo4j 테스트 데이터 삭제 완료");
    }

    @DeleteMapping(path = "/data", params = "source=fedit")
    public Map<String, Object> cleanupFeditData() {
        log.info("[StressTest] fedit 오염 데이터 정리 시작");

        List<Map<String, Object>> allTwins = twinDataSource.getHttpDigitalTwin();
        if (allTwins == null || allTwins.isEmpty()) {
            return Map.of("status", "SKIP", "message", "fedit에 데이터 없음");
        }

        List<String> stressDtids = allTwins.stream()
                .map(t -> t.get("digital_twin_id"))
                .filter(Objects::nonNull)
                .map(String::valueOf)
                .filter(id -> id.startsWith("STRESS-"))
                .toList();

        if (stressDtids.isEmpty()) {
            return Map.of("status", "CLEAN", "message", "fedit에 STRESS- 데이터 없음", "totalTwins", allTwins.size());
        }

        int sentCount = 0;
        for (String dtid : stressDtids) {
            try {
                Map<String, Object> metadata = new LinkedHashMap<>();
                metadata.put("metaTypeModel", "DigitalTwin");
                metadata.put("metaModel", "SingleDigitalTwin");
                metadata.put("dtid", dtid);

                Map<String, Object> message = new LinkedHashMap<>();
                message.put("metadata", metadata);
                message.put("action", "delete");
                message.put("upSetList", List.of());
                message.put("key", dtid);

                String json = objectMapper.writeValueAsString(message);
                kafkaTemplate.send(kafkaTopic, dtid, json);
                sentCount++;
            } catch (Exception e) {
                log.error("[StressTest] fedit 삭제 메시지 전송 실패. dtid={}", dtid, e);
            }
        }

        log.info("[StressTest] fedit 오염 데이터 삭제 메시지 전송 완료. sent={}/{}", sentCount, stressDtids.size());

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("status", "SENT");
        result.put("totalTwins", allTwins.size());
        result.put("stressDataCount", stressDtids.size());
        result.put("deleteSentCount", sentCount);
        result.put("stressDtids", stressDtids);
        result.put("message", "Kafka에 delete 메시지 전송 완료. fedit 컨슈머가 처리 후 삭제됨.");
        return result;
    }

    private void clearNeo4j() {
        cypherBulkSyncService.deleteAllNeo4j();
        log.info("[StressTest] Neo4j 초기화 완료.");
    }

    private void cleanupStellioEntities(List<String> dtids) {
        List<String> entityIds = dtids.stream()
                .map(dtid -> "urn:ngsi-ld:DigitalTwin:" + dtid)
                .toList();
        try {
            brokerClient.batchDeleteEntities(entityIds);
        } catch (Exception e) {
            log.warn("[StressTest] Stellio cleanup 실패", e);
        }
        log.info("[StressTest] Stellio cleanup 완료. count={}", entityIds.size());
    }

    private long percentile(List<Long> sorted, int p) {
        if (sorted.isEmpty()) return 0;
        int index = (int) Math.ceil(p / 100.0 * sorted.size()) - 1;
        return sorted.get(Math.max(0, Math.min(index, sorted.size() - 1)));
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> buildMemoryStats(String scenario,
                                                   Map<String, Object> before,
                                                   Map<String, Object> after,
                                                   List<Map<String, Object>> samples,
                                                   String snapshotKey) {
        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("scenario", scenario);

        Map<String, Object> heapBefore = (Map<String, Object>) before.get(snapshotKey);
        Map<String, Object> heapAfter = (Map<String, Object>) after.get(snapshotKey);

        stats.put("heapBeforeMB", heapBefore != null ? heapBefore.getOrDefault("heapUsedMB", 0) : 0);
        stats.put("heapAfterMB", heapAfter != null ? heapAfter.getOrDefault("heapUsedMB", 0) : 0);
        stats.put("heapDeltaMB",
                toLongSafe(heapAfter, "heapUsedMB") - toLongSafe(heapBefore, "heapUsedMB"));

        if (!samples.isEmpty()) {
            long max = samples.stream()
                    .mapToLong(s -> toLongSafe(s, "heapUsedMB"))
                    .max().orElse(0);
            double avg = samples.stream()
                    .mapToLong(s -> toLongSafe(s, "heapUsedMB"))
                    .average().orElse(0);
            long min = samples.stream()
                    .mapToLong(s -> toLongSafe(s, "heapUsedMB"))
                    .min().orElse(0);

            stats.put("heapMaxMB", max);
            stats.put("heapAvgMB", Math.round(avg * 10) / 10.0);
            stats.put("heapMinMB", min);
            stats.put("sampleCount", samples.size());
        }

        Map<String, Object> osBefore = (Map<String, Object>) before.get("serverOs");
        Map<String, Object> osAfter = (Map<String, Object>) after.get("serverOs");
        if (osBefore != null && osAfter != null) {
            stats.put("serverMemBeforeMB", osBefore.getOrDefault("usedMemoryMB", 0));
            stats.put("serverMemAfterMB", osAfter.getOrDefault("usedMemoryMB", 0));
            stats.put("serverMemDeltaMB",
                    toLongSafe(osAfter, "usedMemoryMB") - toLongSafe(osBefore, "usedMemoryMB"));
        }

        return stats;
    }

    private long toLongSafe(Map<String, Object> map, String key) {
        if (map == null) return 0;
        Object v = map.getOrDefault(key, 0);
        if (v instanceof Number n) return n.longValue();
        return 0;
    }
}
