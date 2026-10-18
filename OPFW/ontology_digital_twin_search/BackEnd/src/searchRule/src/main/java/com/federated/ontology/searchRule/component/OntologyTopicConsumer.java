package com.federated.ontology.searchRule.component;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.federated.ontology.searchRule.dto.kafkaDto.KafkaMessage;
import com.federated.ontology.searchRule.repository.jpa.KafkaMessageEntity;
import com.federated.ontology.searchRule.service.kafkaStaging.KafkaMessageStagingService;

import lombok.extern.slf4j.Slf4j;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.Acknowledgment;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Slf4j
@Component
public class OntologyTopicConsumer {

    private final ObjectMapper objectMapper;
    private final KafkaBatchProcessor batchProcessor;
    private final KafkaMessageStagingService stagingService;

    public OntologyTopicConsumer(ObjectMapper objectMapper,
                                  KafkaBatchProcessor batchProcessor,
                                  KafkaMessageStagingService stagingService) {
        this.objectMapper = objectMapper;
        this.batchProcessor = batchProcessor;
        this.stagingService = stagingService;
    }

    @KafkaListener(
            topics = "${app.kafka.topic.searchRule}",
            groupId = "twin-meta-changelog"
    )
    public void onMessage(List<ConsumerRecord<String, String>> records, Acknowledgment ack) {
        if (records == null || records.isEmpty()) return;

        log.info("[Kafka] poll 수신. count={}", records.size());

        List<KafkaMessage> messages = new ArrayList<>();
        for (ConsumerRecord<String, String> record : records) {
            try {
                if (stagingService.isDuplicate(record.topic(), record.partition(), record.offset())) {
                    log.info("[Kafka] 중복 메시지 스킵. partition={}, offset={}", record.partition(), record.offset());
                    continue;
                }

                KafkaMessage msg = parseMessage(record.value());
                if (msg != null) {
                    KafkaMessageEntity staged = stagingService.saveIncoming(
                            msg, record.topic(), record.partition(), record.offset());
                    msg.setStagedId(staged.getId());
                    messages.add(msg);
                }
            } catch (Exception e) {
                log.error("[Kafka] 메시지 파싱/저장 실패. offset={}", record.offset(), e);
            }
        }

        if (!messages.isEmpty()) {
            log.info("[Kafka] 처리 시작. count={}", messages.size());
            Map<String, Object> timing = batchProcessor.processBatch(messages);
            log.info("[Kafka] 처리 완료. stellio={}ms, neo4j={}ms, total={}ms",
                    timing.get("stellioElapsedMs"), timing.get("neo4jElapsedMs"), timing.get("totalElapsedMs"));
        }

        ack.acknowledge();
    }

    @SuppressWarnings("unchecked")
    private KafkaMessage parseMessage(String json) throws Exception {
        Map<String, Object> message = objectMapper.readValue(
                json, new TypeReference<Map<String, Object>>() {});

        String action = (String) message.get("action");
        Map<String, Object> metadata = (Map<String, Object>) message.get("metadata");

        if (metadata == null || action == null) {
            log.warn("[Kafka] action 또는 metadata 누락.");
            return null;
        }

        String key = (String) message.get("key");
        String metaTypeModel = (String) metadata.get("metaTypeModel");

        List<Map<String, Object>> upSetList = (List<Map<String, Object>>) message.get("upSetList");
        String parentTwinId = null;
        if (upSetList != null && !upSetList.isEmpty()) {
            parentTwinId = (String) upSetList.get(0).get("dtwId");
        }

        return new KafkaMessage(action, metadata, message, key, metaTypeModel, parentTwinId, upSetList);
    }
}
