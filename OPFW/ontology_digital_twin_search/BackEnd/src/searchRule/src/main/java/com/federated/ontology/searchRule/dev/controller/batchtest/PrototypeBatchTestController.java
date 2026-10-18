package com.federated.ontology.searchRule.dev.controller.batchtest;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.federated.ontology.searchRule.component.KafkaBatchProcessor;
import com.federated.ontology.searchRule.dto.kafkaDto.KafkaMessage;
import com.federated.ontology.searchRule.neo4j.sync.CypherBulkSyncService;
import com.federated.ontology.searchRule.neo4j.Neo4jRepositoryHolder;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Profile;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.concurrent.*;

@Slf4j
@Profile("dev")
@RestController
@RequestMapping("/api/v1/dev/kafka-perf")
public class PrototypeBatchTestController {

    private final KafkaBatchProcessor batchProcessor;
    private final CypherBulkSyncService cypherBulkSyncService;
    private final Neo4jRepositoryHolder neo4jRepos;

    public PrototypeBatchTestController(KafkaBatchProcessor batchProcessor,
                                         CypherBulkSyncService cypherBulkSyncService,
                                         Neo4jRepositoryHolder neo4jRepos) {
        this.batchProcessor = batchProcessor;
        this.cypherBulkSyncService = cypherBulkSyncService;
        this.neo4jRepos = neo4jRepos;
    }

    @PostMapping("/single")
    public Map<String, Object> testSingle(@RequestBody(required = false) Map<String, Object> body) {
        int count = body != null && body.get("count") instanceof Number n ? n.intValue() : 50;
        log.info("[BatchTest] 건건 처리 테스트 시작. count={}", count);
        clearNeo4j();

        List<KafkaMessage> dummyMessages = generateDummyMessages(count);

        long start = System.currentTimeMillis();
        int successCount = 0;

        for (KafkaMessage msg : dummyMessages) {
            try {
                batchProcessor.processSingle(msg);
                successCount++;
            } catch (Exception e) {
                log.error("[BatchTest] processSingle 실패. key={}", msg.getKey(), e);
            }
        }

        long elapsed = System.currentTimeMillis() - start;

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("mode", "SINGLE (건건)");
        result.put("requestCount", count);
        result.put("successCount", successCount);
        result.put("elapsedMs", elapsed);
        result.put("avgMsPerItem", count > 0 ? elapsed / count : 0);
        result.put("neo4jTwinCount", neo4jRepos.getTwinRepository().count());
        result.put("neo4jSubjectTermCount", neo4jRepos.getSubjectTermRepository().count());
        result.put("neo4jKeywordTermCount", neo4jRepos.getKeywordTermRepository().count());

        log.info("[BatchTest] 건건 결과: {}ms ({}건, 평균 {}ms/건)",
                elapsed, successCount, count > 0 ? elapsed / count : 0);
        return result;
    }

    @PostMapping("/batch")
    public Map<String, Object> testBatch(@RequestBody(required = false) Map<String, Object> body) {
        int count = body != null && body.get("count") instanceof Number n ? n.intValue() : 50;
        log.info("[BatchTest] 배치 처리 테스트 시작. count={}", count);
        clearNeo4j();

        List<KafkaMessage> dummyMessages = generateDummyMessages(count);

        long start = System.currentTimeMillis();

        try {
            batchProcessor.processBatch(dummyMessages);
        } catch (Exception e) {
            log.error("[BatchTest] processBatch 실패", e);
        }

        long elapsed = System.currentTimeMillis() - start;

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("mode", "BATCH (벌크)");
        result.put("requestCount", count);
        result.put("elapsedMs", elapsed);
        result.put("avgMsPerItem", count > 0 ? elapsed / count : 0);
        result.put("neo4jTwinCount", neo4jRepos.getTwinRepository().count());
        result.put("neo4jSubjectTermCount", neo4jRepos.getSubjectTermRepository().count());
        result.put("neo4jKeywordTermCount", neo4jRepos.getKeywordTermRepository().count());

        log.info("[BatchTest] 배치 결과: {}ms ({}건, 평균 {}ms/건)",
                elapsed, count, count > 0 ? elapsed / count : 0);
        return result;
    }

    @PostMapping("/neo4j-bulk")
    public Map<String, Object> testNeo4jBulk(@RequestBody(required = false) Map<String, Object> body) {
        int count = body != null && body.get("count") instanceof Number n ? n.intValue() : 50;
        log.info("[BatchTest] Neo4j 벌크 직접 테스트 시작. count={}", count);
        clearNeo4j();

        List<Map<String, Object>> twinMetadataList = generateDummyTwinMetadata(count);

        long start = System.currentTimeMillis();

        int saved = cypherBulkSyncService.syncFromMetadataList(twinMetadataList, List.of());

        long elapsed = System.currentTimeMillis() - start;

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("mode", "NEO4J_BULK (Stellio 제외, Neo4j만)");
        result.put("requestCount", count);
        result.put("savedCount", saved);
        result.put("elapsedMs", elapsed);
        result.put("avgMsPerItem", count > 0 ? elapsed / count : 0);
        result.put("neo4jTwinCount", neo4jRepos.getTwinRepository().count());
        result.put("neo4jSubjectTermCount", neo4jRepos.getSubjectTermRepository().count());
        result.put("neo4jKeywordTermCount", neo4jRepos.getKeywordTermRepository().count());

        log.info("[BatchTest] Neo4j 벌크 결과: {}ms ({}건, 평균 {}ms/건)",
                elapsed, saved, count > 0 ? elapsed / count : 0);
        return result;
    }

    @PostMapping("/adaptive")
    public Map<String, Object> testAdaptive(@RequestBody(required = false) Map<String, Object> body) {
        int count = body != null && body.get("count") instanceof Number n ? n.intValue() : 50;
        int delayMs = body != null && body.get("delayMs") instanceof Number d ? d.intValue() : 10;
        log.info("[BatchTest] 적응형 시뮬레이션 시작. count={}, delayMs={}", count, delayMs);
        clearNeo4j();

        List<KafkaMessage> dummyMessages = generateDummyMessages(count);

        List<KafkaMessage> buffer = Collections.synchronizedList(new ArrayList<>());
        java.util.concurrent.atomic.AtomicBoolean processing = new java.util.concurrent.atomic.AtomicBoolean(false);
        java.util.concurrent.atomic.AtomicInteger singleCount = new java.util.concurrent.atomic.AtomicInteger(0);
        java.util.concurrent.atomic.AtomicInteger batchCount = new java.util.concurrent.atomic.AtomicInteger(0);
        java.util.concurrent.atomic.AtomicInteger batchRounds = new java.util.concurrent.atomic.AtomicInteger(0);

        long start = System.currentTimeMillis();

        for (KafkaMessage msg : dummyMessages) {
            if (!processing.compareAndSet(false, true)) {
                buffer.add(msg);
                continue;
            }

            try {
                batchProcessor.processSingle(msg);
                singleCount.incrementAndGet();

                while (!buffer.isEmpty()) {
                    List<KafkaMessage> batch;
                    synchronized (buffer) {
                        batch = new ArrayList<>(buffer);
                        buffer.clear();
                    }
                    batchProcessor.processBatch(batch);
                    batchCount.addAndGet(batch.size());
                    batchRounds.incrementAndGet();
                }
            } finally {
                processing.set(false);
            }

            if (delayMs > 0) {
                try { Thread.sleep(delayMs); } catch (InterruptedException ignored) {}
            }
        }

        long elapsed = System.currentTimeMillis() - start;

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("mode", "ADAPTIVE (적응형)");
        result.put("requestCount", count);
        result.put("delayMs", delayMs);
        result.put("singleProcessed", singleCount.get());
        result.put("batchProcessed", batchCount.get());
        result.put("batchRounds", batchRounds.get());
        result.put("elapsedMs", elapsed);
        result.put("avgMsPerItem", count > 0 ? elapsed / count : 0);
        result.put("neo4jTwinCount", neo4jRepos.getTwinRepository().count());
        result.put("neo4jSubjectTermCount", neo4jRepos.getSubjectTermRepository().count());
        result.put("neo4jKeywordTermCount", neo4jRepos.getKeywordTermRepository().count());

        log.info("[BatchTest] 적응형 결과: {}ms (single={}, batch={}, rounds={})",
                elapsed, singleCount.get(), batchCount.get(), batchRounds.get());
        return result;
    }

    private List<KafkaMessage> generateDummyMessages(int count) {
        List<KafkaMessage> messages = new ArrayList<>();
        String[] subjectPool = {"제조", "에너지", "환경", "물류", "관광"};
        String[] keywordPool = {"온도", "센서", "습도", "진동", "압력", "전력", "유량"};

        for (int i = 0; i < count; i++) {
            String dtid = String.format("TEST-%05d", i);
            Map<String, Object> metadata = new LinkedHashMap<>();
            metadata.put("dtid", dtid);
            metadata.put("name", "테스트 트윈 " + i);
            metadata.put("description", "배치 테스트용 더미 데이터 #" + i);
            metadata.put("owner", "tester");
            metadata.put("subjects", List.of(subjectPool[i % subjectPool.length]));
            metadata.put("keywords", List.of(
                    keywordPool[i % keywordPool.length],
                    keywordPool[(i + 1) % keywordPool.length]
            ));

            Map<String, Object> fullMessage = new LinkedHashMap<>(metadata);
            fullMessage.put("id", dtid);

            messages.add(new KafkaMessage("create", metadata, fullMessage, dtid, "DigitalTwin", null, null));
        }

        return messages;
    }

    private List<Map<String, Object>> generateDummyTwinMetadata(int count) {
        List<Map<String, Object>> list = new ArrayList<>();
        String[] subjectPool = {"제조", "에너지", "환경", "물류", "관광"};
        String[] keywordPool = {"온도", "센서", "습도", "진동", "압력", "전력", "유량"};

        for (int i = 0; i < count; i++) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("dtid", String.format("TEST-%05d", i));
            m.put("name", "테스트 트윈 " + i);
            m.put("description", "배치 테스트용 더미 데이터 #" + i);
            m.put("owner", "tester");
            m.put("subjects", List.of(subjectPool[i % subjectPool.length]));
            m.put("keywords", List.of(
                    keywordPool[i % keywordPool.length],
                    keywordPool[(i + 1) % keywordPool.length]
            ));
            list.add(m);
        }

        return list;
    }

    private void clearNeo4j() {
        cypherBulkSyncService.deleteAllNeo4j();
        log.info("[BatchTest] Neo4j 초기화 완료.");
    }
}
