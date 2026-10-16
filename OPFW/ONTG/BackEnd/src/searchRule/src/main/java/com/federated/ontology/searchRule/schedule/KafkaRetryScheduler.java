package com.federated.ontology.searchRule.schedule;

import com.federated.ontology.searchRule.component.KafkaBatchProcessor;
import com.federated.ontology.searchRule.dto.kafkaDto.KafkaMessage;
import com.federated.ontology.searchRule.neo4j.sync.CypherBulkSyncService;
import com.federated.ontology.searchRule.repository.jpa.KafkaMessageEntity;
import com.federated.ontology.searchRule.repository.jpa.KafkaMessageRepository;
import com.federated.ontology.searchRule.repository.jpa.ProcessingStatus;
import com.federated.ontology.searchRule.service.kafkaStaging.KafkaMessageStagingService;
import com.federated.ontology.searchRule.serviceImpl.ngsildClientServiceImpl.NgsiLdBrokerClient;
import io.micrometer.core.instrument.Gauge;
import io.micrometer.core.instrument.MeterRegistry;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import jakarta.annotation.PostConstruct;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Component
@ConditionalOnProperty(name = "retry.scheduler.enabled", havingValue = "true", matchIfMissing = false)
public class KafkaRetryScheduler {

    private final KafkaMessageRepository repository;
    private final KafkaMessageStagingService stagingService;
    private final KafkaBatchProcessor batchProcessor;
    private final CypherBulkSyncService cypherBulkSyncService;
    private final NgsiLdBrokerClient brokerClient;
    private final MeterRegistry meterRegistry;

    @Value("${retry.scheduler.max-retries:5}")
    private int maxRetries;

    @Value("${retry.scheduler.batch-size:20}")
    private int batchSize;

    @Value("${retry.scheduler.cooldown-seconds:90}")
    private int cooldownSeconds;

    @Value("${retry.scheduler.retrying-timeout-minutes:10}")
    private int retryingTimeoutMinutes;

    public KafkaRetryScheduler(KafkaMessageRepository repository,
                                KafkaMessageStagingService stagingService,
                                KafkaBatchProcessor batchProcessor,
                                CypherBulkSyncService cypherBulkSyncService,
                                NgsiLdBrokerClient brokerClient,
                                MeterRegistry meterRegistry) {
        this.repository = repository;
        this.stagingService = stagingService;
        this.batchProcessor = batchProcessor;
        this.cypherBulkSyncService = cypherBulkSyncService;
        this.brokerClient = brokerClient;
        this.meterRegistry = meterRegistry;
    }

    @PostConstruct
    public void registerMetrics() {
        Gauge.builder("kafka.staging.failed", repository,
                r -> r.countByStatus(ProcessingStatus.FAILED))
                .description("FAILED 상태 Kafka 스테이징 메시지 수")
                .register(meterRegistry);
        Gauge.builder("kafka.staging.dead_letter", repository,
                r -> r.countByStatus(ProcessingStatus.DEAD_LETTER))
                .description("DEAD_LETTER 상태 메시지 수 (수동 확인 필요)")
                .register(meterRegistry);
        Gauge.builder("kafka.staging.retrying", repository,
                r -> r.countByStatus(ProcessingStatus.RETRYING))
                .description("RETRYING 상태 메시지 수 (스케줄러 처리 중)")
                .register(meterRegistry);
    }

    @Scheduled(fixedDelayString = "${retry.scheduler.interval-ms:60000}")
    public void retryFailedMessages() {
        List<KafkaMessageEntity> claimed = claimRetryTargets();
        if (claimed.isEmpty()) {
            resetStuckRetrying();
            return;
        }

        log.info("[RetryScheduler] {} 건 재시도 시작", claimed.size());

        List<KafkaMessageEntity> upsertEntities = new ArrayList<>();
        List<KafkaMessageEntity> deleteEntities = new ArrayList<>();

        for (KafkaMessageEntity entity : claimed) {
            if ("delete".equals(entity.getAction())) {
                deleteEntities.add(entity);
            } else {
                upsertEntities.add(entity);
            }
        }

        retryUpserts(upsertEntities);

        retryDeletes(deleteEntities);

        resetStuckRetrying();
    }

    @Transactional("jpaTransactionManager")
    public List<KafkaMessageEntity> claimRetryTargets() {
        LocalDateTime cutoff = LocalDateTime.now().minusSeconds(cooldownSeconds);
        List<KafkaMessageEntity> targets = repository.findRetryTargets(
                cutoff, PageRequest.of(0, batchSize));

        if (targets.isEmpty()) return targets;

        List<Long> ids = targets.stream().map(KafkaMessageEntity::getId).toList();
        repository.markRetryingBulk(ids, ProcessingStatus.RETRYING, LocalDateTime.now());

        log.debug("[RetryScheduler] Phase A: {} 건 잠금", ids.size());
        return targets;
    }

    private void retryUpserts(List<KafkaMessageEntity> entities) {
        if (entities.isEmpty()) return;

        List<Map<String, Object>> successTwinMeta = new ArrayList<>();
        List<Map<String, Object>> successObjectMeta = new ArrayList<>();
        List<KafkaMessageEntity> stellioSuccessEntities = new ArrayList<>();

        for (KafkaMessageEntity entity : entities) {
            try {
                String failedPhase = entity.getFailedPhase();
                boolean needsStellio = !"NEO4J".equals(failedPhase);

                KafkaMessage msg = reconstructMessage(entity);

                if (needsStellio) {
                    if (msg.isDigitalTwinObject() && msg.getParentTwinId() == null) {
                        handleRetryFailure(entity, "STELLIO", "parentTwinId 누락 — 재시도 불가");
                        continue;
                    }

                    boolean ok = batchProcessor.upsertToStellio(msg);
                    if (!ok) {
                        handleRetryFailure(entity, "STELLIO", "Stellio upsert 반환 false");
                        continue;
                    }
                }

                batchProcessor.normalizeMetadataForNeo4j(msg);

                if (msg.isDigitalTwinObject()) {
                    successObjectMeta.add(msg.getMetadata());
                } else {
                    successTwinMeta.add(msg.getMetadata());
                }
                stellioSuccessEntities.add(entity);

            } catch (Exception e) {
                handleRetryFailure(entity, entity.getFailedPhase(), e.getMessage());
            }
        }

        if (!successTwinMeta.isEmpty() || !successObjectMeta.isEmpty()) {
            try {
                int saved = cypherBulkSyncService.syncFromMetadataList(
                        successTwinMeta, successObjectMeta);
                log.info("[RetryScheduler] Neo4j 벌크 저장 완료. saved={}", saved);

                for (KafkaMessageEntity entity : stellioSuccessEntities) {
                    stagingService.removeCompleted(entity.getId());
                }
            } catch (Exception e) {
                log.error("[RetryScheduler] Neo4j 벌크 저장 실패", e);
                for (KafkaMessageEntity entity : stellioSuccessEntities) {
                    handleRetryFailure(entity, "NEO4J", e.getMessage());
                }
            }
        }
    }

    private void retryDeletes(List<KafkaMessageEntity> entities) {
        if (entities.isEmpty()) return;

        for (KafkaMessageEntity entity : entities) {
            try {
                String failedPhase = entity.getFailedPhase();
                String entityType = "DigitalTwinObject".equals(entity.getMetaTypeModel())
                        ? "DigitalObject" : "DigitalTwin";
                String entityUrn = "urn:ngsi-ld:" + entityType + ":" + entity.getKey();

                boolean needsStellio = !"NEO4J".equals(failedPhase);

                if (needsStellio) {
                    boolean deleted = brokerClient.deleteEntity(entityUrn);
                    if (!deleted) {
                        log.info("[RetryScheduler] Stellio 삭제 반환 false (이미 삭제?). urn={}", entityUrn);
                    }
                }

                cypherBulkSyncService.deleteEntity(entityType, entity.getKey());

                stagingService.removeCompleted(entity.getId());
                log.info("[RetryScheduler] delete 재시도 성공. type={}, key={}", entityType, entity.getKey());

            } catch (Exception e) {
                handleRetryFailure(entity, entity.getFailedPhase(), e.getMessage());
                log.error("[RetryScheduler] delete 재시도 실패. key={}", entity.getKey(), e);
            }
        }
    }

    private void handleRetryFailure(KafkaMessageEntity entity, String phase, String errorMessage) {
        if (entity.getRetryCount() >= maxRetries) {
            stagingService.markDeadLetter(entity.getId(),
                    "최대 재시도 " + maxRetries + "회 초과: " + errorMessage);
            log.warn("[RetryScheduler] DEAD_LETTER 전환. id={}, key={}", entity.getId(), entity.getKey());
        } else {
            stagingService.markFailedWithPhase(entity.getId(), phase, errorMessage);
        }
    }

    private KafkaMessage reconstructMessage(KafkaMessageEntity entity) {
        Map<String, Object> metadataCopy = new HashMap<>(entity.getMetadata());
        return new KafkaMessage(
                entity.getAction(),
                metadataCopy,
                entity.getFullMessage(),
                entity.getKey(),
                entity.getMetaTypeModel(),
                entity.getParentTwinId(),
                null
        );
    }

    private void resetStuckRetrying() {
        LocalDateTime stuckBefore = LocalDateTime.now().minusMinutes(retryingTimeoutMinutes);
        stagingService.resetStuckRetrying(stuckBefore);
    }
}
