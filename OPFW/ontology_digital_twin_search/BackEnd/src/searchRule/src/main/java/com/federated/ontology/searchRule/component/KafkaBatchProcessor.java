package com.federated.ontology.searchRule.component;

import com.federated.ontology.searchRule.dto.kafkaDto.KafkaMessage;
import com.federated.ontology.searchRule.neo4j.sync.CypherBulkSyncService;
import com.federated.ontology.searchRule.service.kafkaStaging.KafkaMessageStagingService;
import com.federated.ontology.searchRule.service.ngsildClientService.NgsildClientService;
import com.federated.ontology.searchRule.serviceImpl.ngsildClientServiceImpl.NgsiLdBrokerClient;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicReference;

@Slf4j
@Component
public class KafkaBatchProcessor {

    private final NgsildClientService ngsiLdClientService;
    private final NgsiLdBrokerClient brokerClient;
    private final CypherBulkSyncService cypherBulkSyncService;
    private final KafkaMessageStagingService stagingService;

    private final AtomicReference<Map<String, Object>> lastBatchTiming = new AtomicReference<>();

    public KafkaBatchProcessor(NgsildClientService ngsiLdClientService,
                                NgsiLdBrokerClient brokerClient,
                                CypherBulkSyncService cypherBulkSyncService,
                                KafkaMessageStagingService stagingService) {
        this.ngsiLdClientService = ngsiLdClientService;
        this.brokerClient = brokerClient;
        this.cypherBulkSyncService = cypherBulkSyncService;
        this.stagingService = stagingService;
    }

    public Map<String, Object> getLastBatchTiming() {
        return lastBatchTiming.get();
    }

    public Map<String, Object> processSingle(KafkaMessage msg) {
        return processBatch(List.of(msg));
    }

    public Map<String, Object> processBatch(List<KafkaMessage> batch) {
        log.info("[Batch] 배치 처리 시작. size={}", batch.size());

        List<KafkaMessage> upserts = new ArrayList<>();
        List<KafkaMessage> deletes = new ArrayList<>();

        for (KafkaMessage msg : batch) {
            switch (msg.getAction()) {
                case "create", "modify" -> upserts.add(msg);
                case "delete" -> deletes.add(msg);
                default -> log.warn("[Batch] 알 수 없는 action: {}, key: {}", msg.getAction(), msg.getKey());
            }
        }

        long stellioStart = System.currentTimeMillis();

        List<Map<String, Object>> successTwinMetadataList = new ArrayList<>();
        List<Map<String, Object>> successObjectMetadataList = new ArrayList<>();
        List<KafkaMessage> stellioSuccessMessages = new ArrayList<>();
        int stellioSuccessCount = 0;
        int stellioFailCount = 0;

        for (KafkaMessage msg : upserts) {
            try {
                boolean success = upsertToStellio(msg);
                if (success) {
                    stellioSuccessCount++;
                    if (msg.getStagedId() != null) stagingService.markStellioDone(msg.getStagedId());

                    normalizeMetadataForNeo4j(msg);
                    stellioSuccessMessages.add(msg);

                    if (msg.isDigitalTwinObject()) {
                        successObjectMetadataList.add(msg.getMetadata());
                    } else {
                        successTwinMetadataList.add(msg.getMetadata());
                    }
                } else {
                    stellioFailCount++;
                    if (msg.getStagedId() != null) {
                        stagingService.markFailedWithPhase(msg.getStagedId(), "STELLIO", "Stellio upsert 실패");
                    }
                    log.error("[Batch] Stellio upsert 실패. key={}", msg.getKey());
                }
            } catch (Exception e) {
                stellioFailCount++;
                if (msg.getStagedId() != null) {
                    stagingService.markFailedWithPhase(msg.getStagedId(), "STELLIO", e.getMessage());
                }
                log.error("[Batch] Stellio upsert 예외. key={}", msg.getKey(), e);
            }
        }

        for (KafkaMessage msg : deletes) {
            try {
                String entityUrn = buildEntityUrn(msg);
                boolean deleted = brokerClient.deleteEntity(entityUrn);
                if (deleted) {
                    String entityType = msg.isDigitalTwinObject() ? "DigitalObject" : "DigitalTwin";
                    cypherBulkSyncService.deleteEntity(entityType, msg.getKey());
                    if (msg.getStagedId() != null) stagingService.removeCompleted(msg.getStagedId());
                    log.info("[Batch] delete 성공. type={}, key={}", entityType, msg.getKey());
                } else {
                    if (msg.getStagedId() != null) {
                        stagingService.markFailedWithPhase(msg.getStagedId(), "STELLIO", "delete 반환 false");
                    }
                }
            } catch (Exception e) {
                if (msg.getStagedId() != null) {
                    stagingService.markFailedWithPhase(msg.getStagedId(), "STELLIO", e.getMessage());
                }
                log.error("[Batch] delete 예외. key={}", msg.getKey(), e);
            }
        }

        long stellioElapsed = System.currentTimeMillis() - stellioStart;

        long neo4jStart = System.currentTimeMillis();
        int neo4jSavedCount = 0;

        if (!successTwinMetadataList.isEmpty() || !successObjectMetadataList.isEmpty()) {
            try {
                neo4jSavedCount = cypherBulkSyncService.syncFromMetadataList(
                        successTwinMetadataList, successObjectMetadataList);

                for (KafkaMessage msg : stellioSuccessMessages) {
                    if (msg.getStagedId() != null) {
                        stagingService.removeCompleted(msg.getStagedId());
                    }
                }
            } catch (Exception e) {
                log.error("[Batch] Neo4j 벌크 저장 실패", e);
                for (KafkaMessage msg : stellioSuccessMessages) {
                    if (msg.getStagedId() != null) {
                        stagingService.markFailedWithPhase(msg.getStagedId(), "NEO4J", e.getMessage());
                    }
                }
            }
        }

        long neo4jElapsed = System.currentTimeMillis() - neo4jStart;
        long totalElapsed = stellioElapsed + neo4jElapsed;

        Map<String, Object> timing = new LinkedHashMap<>();
        timing.put("batchSize", batch.size());
        timing.put("stellioElapsedMs", stellioElapsed);
        timing.put("stellioSuccessCount", stellioSuccessCount);
        timing.put("stellioFailCount", stellioFailCount);
        timing.put("neo4jElapsedMs", neo4jElapsed);
        timing.put("neo4jSavedCount", neo4jSavedCount);
        timing.put("totalElapsedMs", totalElapsed);
        timing.put("twinCount", successTwinMetadataList.size());
        timing.put("objectCount", successObjectMetadataList.size());
        timing.put("deleteCount", deletes.size());

        this.lastBatchTiming.set(timing);

        log.info("[Batch] 배치 처리 완료. stellio={}ms(성공={},실패={}), neo4j={}ms(저장={}), total={}ms",
                stellioElapsed, stellioSuccessCount, stellioFailCount,
                neo4jElapsed, neo4jSavedCount, totalElapsed);

        return timing;
    }

    public boolean upsertToStellio(KafkaMessage msg) {
        String key = msg.getKey();
        Map<String, Object> metadata = msg.getMetadata();

        String result;
        if (msg.isDigitalTwinObject()) {
            result = ngsiLdClientService.updateDigitalObjectEntity(metadata, key, msg.getParentTwinId());
        } else if ("DigitalTwin".equals(msg.getMetaTypeModel())) {
            result = ngsiLdClientService.updateDigitalTwinEntity(metadata, key);
        } else {
            log.error("[Stellio] 알 수 없는 metaTypeModel: {}, key={}", msg.getMetaTypeModel(), key);
            return false;
        }
        return "SUCCESS".equals(result);
    }

    public void normalizeMetadataForNeo4j(KafkaMessage msg) {
        Map<String, Object> metadata = msg.getMetadata();
        String key = msg.getKey();

        if (msg.isDigitalTwinObject()) {
            metadata.put("objectId", key);
            if (msg.getParentTwinId() != null) {
                metadata.put("parentTwinId", msg.getParentTwinId());
            }
        } else {
            metadata.put("dtid", key);
        }
    }

    public String buildEntityUrn(KafkaMessage msg) {
        String type = msg.isDigitalTwinObject() ? "DigitalObject" : "DigitalTwin";
        return "urn:ngsi-ld:" + type + ":" + msg.getKey();
    }
}
