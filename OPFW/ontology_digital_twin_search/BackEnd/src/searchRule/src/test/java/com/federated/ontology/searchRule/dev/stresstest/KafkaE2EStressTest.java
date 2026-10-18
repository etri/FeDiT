package com.federated.ontology.searchRule.dev.stresstest;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.federated.ontology.searchRule.neo4j.Neo4jRepositoryHolder;
import com.federated.ontology.searchRule.serviceImpl.ngsildClientServiceImpl.NgsiLdBrokerClient;
import org.junit.jupiter.api.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.kafka.core.KafkaTemplate;

import java.util.*;
import java.util.concurrent.*;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(
        webEnvironment = SpringBootTest.WebEnvironment.DEFINED_PORT,
        properties = "spring.autoconfigure.exclude="
                + "org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration,"
                + "org.springframework.boot.autoconfigure.jdbc.DataSourceTransactionManagerAutoConfiguration,"
                + "org.springframework.boot.autoconfigure.orm.jpa.HibernateJpaAutoConfiguration,"
                + "org.springframework.boot.autoconfigure.batch.BatchAutoConfiguration"
)
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
@Disabled("프로덕션 Kafka 브로커에 직접 전송하여 데이터풀 오염 위험. StressTestController.pipeline으로 대체됨")
class KafkaE2EStressTest {

    private static final Logger log = LoggerFactory.getLogger(KafkaE2EStressTest.class);

    @Autowired
    private KafkaTemplate<String, String> kafkaTemplate;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private Neo4jRepositoryHolder neo4jRepos;

    @Autowired
    private NgsiLdBrokerClient brokerClient;

    @Autowired
    private StressTestDataGenerator dataGenerator;

    @Value("${app.kafka.topic.searchRule}")
    private String topic;

    private static final long POLL_INTERVAL_MS = 500;
    private static final long TIMEOUT_MS = 60_000;

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
    @Test
    @DisplayName("E2E 단건 메시지: Kafka → Stellio → Neo4j")
    void testE2E_singleMessage() throws Exception {
        String prefix = dataGenerator.generatePrefix();
        String dtid = prefix + "-00000";

        Map<String, Object> payload = dataGenerator.generateKafkaMessagePayload(dtid, 0, "create");
        String json = objectMapper.writeValueAsString(payload);

        long startTime = System.currentTimeMillis();
        kafkaTemplate.send(topic, "e2e-single", json);

        boolean found = pollNeo4jForDtid(dtid, TIMEOUT_MS);
        long e2eLatency = System.currentTimeMillis() - startTime;

        log.info("[E2E] 단건 결과: found={}, latency={}ms, dtid={}", found, e2eLatency, dtid);

        assertThat(found).as("Neo4j에서 dtid=%s 확인", dtid).isTrue();
        log.info("[E2E] 단건 E2E latency: {}ms", e2eLatency);
    }

    @Order(2)
    @ParameterizedTest(name = "E2E burst {0}건")
    @ValueSource(ints = {10, 50, 100})
    void testE2E_burstMessages(int count) throws Exception {
        String prefix = dataGenerator.generatePrefix();
        List<String> dtids = dataGenerator.generateDtids(count, prefix);

        long startTime = System.currentTimeMillis();

        for (int i = 0; i < count; i++) {
            Map<String, Object> payload = dataGenerator.generateKafkaMessagePayload(dtids.get(i), i, "create");
            String json = objectMapper.writeValueAsString(payload);
            kafkaTemplate.send(topic, "e2e-burst-" + i, json);
        }

        long sendElapsed = System.currentTimeMillis() - startTime;
        log.info("[E2E] {} 건 전송 완료: {}ms", count, sendElapsed);

        boolean allSynced = pollNeo4jForCount(count, TIMEOUT_MS);
        long totalElapsed = System.currentTimeMillis() - startTime;

        long actualCount = neo4jRepos.getTwinRepository().count();
        double throughput = totalElapsed > 0 ? (double) actualCount / totalElapsed * 1000 : 0;

        log.info("[E2E] burst 결과: sent={}, synced={}, total={}ms, throughput={} msg/sec",
                count, actualCount, totalElapsed, String.format("%.1f", throughput));

        assertThat(allSynced).as("Neo4j에 %d건 동기화 완료", count).isTrue();
    }

    @Order(3)
    @Test
    @DisplayName("E2E sustained throughput: 200건 @ 20msg/s")
    void testE2E_sustainedThroughput() throws Exception {
        int totalMessages = 200;
        int ratePerSec = 20;
        long intervalMs = 1000 / ratePerSec;

        String prefix = dataGenerator.generatePrefix();
        List<String> dtids = dataGenerator.generateDtids(totalMessages, prefix);

        long startTime = System.currentTimeMillis();
        int sent = 0;

        for (int i = 0; i < totalMessages; i++) {
            Map<String, Object> payload = dataGenerator.generateKafkaMessagePayload(dtids.get(i), i, "create");
            String json = objectMapper.writeValueAsString(payload);
            kafkaTemplate.send(topic, "e2e-sustained-" + i, json);
            sent++;

            if (i < totalMessages - 1) {
                Thread.sleep(intervalMs);
            }
        }

        long sendElapsed = System.currentTimeMillis() - startTime;
        log.info("[E2E] Sustained 전송 완료: {}건 in {}ms", sent, sendElapsed);

        boolean allSynced = pollNeo4jForCount(totalMessages, 120_000);
        long totalElapsed = System.currentTimeMillis() - startTime;
        long actualCount = neo4jRepos.getTwinRepository().count();

        log.info("[E2E] Sustained 결과: sent={}, synced={}, total={}ms, allSynced={}",
                totalMessages, actualCount, totalElapsed, allSynced);

        assertThat(actualCount).as("최소 90%% 동기화").isGreaterThanOrEqualTo((long) (totalMessages * 0.9));
    }

    @Order(4)
    @Test
    @DisplayName("E2E delete flow: create 10건 → delete 10건")
    void testE2E_deleteFlow() throws Exception {
        int count = 10;
        String prefix = dataGenerator.generatePrefix();
        List<String> dtids = dataGenerator.generateDtids(count, prefix);

        for (int i = 0; i < count; i++) {
            Map<String, Object> payload = dataGenerator.generateKafkaMessagePayload(dtids.get(i), i, "create");
            String json = objectMapper.writeValueAsString(payload);
            kafkaTemplate.send(topic, "e2e-delete-create-" + i, json);
        }

        boolean created = pollNeo4jForCount(count, TIMEOUT_MS);
        log.info("[E2E] Delete flow - 생성 완료: created={}", created);
        assertThat(created).isTrue();

        clearNeo4j();
        for (int i = 0; i < count; i++) {
            Map<String, Object> payload = dataGenerator.generateKafkaMessagePayload(dtids.get(i), i, "delete");
            String json = objectMapper.writeValueAsString(payload);
            kafkaTemplate.send(topic, "e2e-delete-" + i, json);
        }

        Thread.sleep(5000);
        long remaining = neo4jRepos.getTwinRepository().count();

        log.info("[E2E] Delete flow 결과: remaining={}", remaining);
        assertThat(remaining).isEqualTo(0);
    }

    private boolean pollNeo4jForDtid(String dtid, long timeoutMs) throws InterruptedException {
        long deadline = System.currentTimeMillis() + timeoutMs;
        while (System.currentTimeMillis() < deadline) {
            if (neo4jRepos.getTwinRepository().findById(dtid).isPresent()) {
                return true;
            }
            Thread.sleep(POLL_INTERVAL_MS);
        }
        return false;
    }

    private boolean pollNeo4jForCount(int expectedCount, long timeoutMs) throws InterruptedException {
        long deadline = System.currentTimeMillis() + timeoutMs;
        while (System.currentTimeMillis() < deadline) {
            if (neo4jRepos.getTwinRepository().count() >= expectedCount) {
                return true;
            }
            Thread.sleep(POLL_INTERVAL_MS);
        }
        return false;
    }
}
