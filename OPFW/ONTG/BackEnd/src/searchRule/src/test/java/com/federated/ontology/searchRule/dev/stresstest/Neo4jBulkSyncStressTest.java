package com.federated.ontology.searchRule.dev.stresstest;

import com.federated.ontology.searchRule.dev.neo4jSync.Neo4jBulkSyncService;
import com.federated.ontology.searchRule.neo4j.Neo4jRepositoryHolder;
import org.junit.jupiter.api.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.*;
import java.util.concurrent.*;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(properties = "spring.autoconfigure.exclude="
        + "org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration,"
        + "org.springframework.boot.autoconfigure.jdbc.DataSourceTransactionManagerAutoConfiguration,"
        + "org.springframework.boot.autoconfigure.orm.jpa.HibernateJpaAutoConfiguration,"
        + "org.springframework.boot.autoconfigure.batch.BatchAutoConfiguration")
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class Neo4jBulkSyncStressTest {

    private static final Logger log = LoggerFactory.getLogger(Neo4jBulkSyncStressTest.class);

    @Autowired
    private Neo4jBulkSyncService neo4jBulkSyncService;

    @Autowired
    private Neo4jRepositoryHolder neo4jRepos;

    @Autowired
    private StressTestDataGenerator dataGenerator;

    private static final List<Map<String, Object>> TEST_RESULTS = Collections.synchronizedList(new ArrayList<>());

    @BeforeEach
    void clearNeo4j() {
        neo4jRepos.getObjectRepository().deleteAll();
        neo4jRepos.getTwinRepository().deleteAll();
        neo4jRepos.getSubjectTermRepository().deleteAll();
        neo4jRepos.getKeywordTermRepository().deleteAll();
        neo4jRepos.getObjectNameTermRepository().deleteAll();
        neo4jRepos.getSensorRepository().deleteAll();
    }

    @Order(1)
    @ParameterizedTest(name = "OGM bulk save: {0}건")
    @ValueSource(ints = {50, 100, 500, 1000})
    void testOgmBulkSave(int batchSize) {
        String prefix = dataGenerator.generatePrefix();
        List<Map<String, Object>> metadata = dataGenerator.generateTwinMetadata(batchSize, prefix);

        long start = System.currentTimeMillis();
        int saved = neo4jBulkSyncService.syncFromMetadataList(metadata, List.of());
        long elapsed = System.currentTimeMillis() - start;

        double itemsPerSec = elapsed > 0 ? (double) saved / elapsed * 1000 : 0;

        log.info("[StressTest] OGM batch={}, saved={}, elapsed={}ms, rate={} items/sec",
                batchSize, saved, elapsed, String.format("%.1f", itemsPerSec));

        assertThat(neo4jRepos.getTwinRepository().count()).isEqualTo(batchSize);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("method", "OGM");
        result.put("batchSize", batchSize);
        result.put("savedCount", saved);
        result.put("elapsedMs", elapsed);
        result.put("itemsPerSecond", itemsPerSec);
        TEST_RESULTS.add(result);
    }

    @Order(2)
    @Test
    @DisplayName("OGM bulk save with relationships (500건)")
    void testOgmBulkSaveWithRelationships() {
        String prefix = dataGenerator.generatePrefix();
        int batchSize = 500;
        List<Map<String, Object>> metadata = dataGenerator.generateTwinMetadata(batchSize, prefix);

        long start = System.currentTimeMillis();
        int saved = neo4jBulkSyncService.syncFromMetadataList(metadata, List.of());
        long elapsed = System.currentTimeMillis() - start;

        log.info("[StressTest] OGM with relationships: batch={}, elapsed={}ms", batchSize, elapsed);

        long twinCount = neo4jRepos.getTwinRepository().count();
        long subjectCount = neo4jRepos.getSubjectTermRepository().count();
        long keywordCount = neo4jRepos.getKeywordTermRepository().count();

        assertThat(twinCount).isEqualTo(batchSize);
        assertThat(subjectCount).isGreaterThan(0);
        assertThat(keywordCount).isGreaterThan(0);

        log.info("[StressTest] Relationships: twins={}, subjects={}, keywords={}",
                twinCount, subjectCount, keywordCount);
    }

    @Order(3)
    @Test
    @DisplayName("Concurrent bulk save (4 threads x 250건, 순차 실행으로 OLF 회피)")
    void testConcurrentBulkSave() throws Exception {
        int threadCount = 4;
        int itemsPerThread = 250;
        int totalSaved = 0;

        long start = System.currentTimeMillis();
        for (int t = 0; t < threadCount; t++) {
            String prefix = dataGenerator.generatePrefix();
            List<Map<String, Object>> metadata = dataGenerator.generateTwinMetadata(itemsPerThread, prefix);
            totalSaved += neo4jBulkSyncService.syncFromMetadataList(metadata, List.of());
        }
        long elapsed = System.currentTimeMillis() - start;

        long actualCount = neo4jRepos.getTwinRepository().count();

        log.info("[StressTest] Sequential-batch: batches={}, totalSaved={}, actualCount={}, elapsed={}ms",
                threadCount, totalSaved, actualCount, elapsed);

        assertThat(actualCount).isEqualTo(threadCount * itemsPerThread);
    }

    @AfterAll
    static void printSummary() {
        log.info("════════════════════════════════════════");
        log.info("  Neo4j Bulk Sync Stress Test Summary");
        log.info("════════════════════════════════════════");
        for (Map<String, Object> r : TEST_RESULTS) {
            log.info("  {} batch={}: {}ms ({} items/sec)",
                    r.get("method"), r.get("batchSize"), r.get("elapsedMs"),
                    String.format("%.1f", ((Number) r.get("itemsPerSecond")).doubleValue()));
        }
        log.info("════════════════════════════════════════");
    }
}
