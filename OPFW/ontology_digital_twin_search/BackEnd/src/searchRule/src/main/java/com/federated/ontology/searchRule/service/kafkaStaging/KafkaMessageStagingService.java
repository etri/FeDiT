package com.federated.ontology.searchRule.service.kafkaStaging;

import com.federated.ontology.searchRule.dto.kafkaDto.KafkaMessage;
import com.federated.ontology.searchRule.repository.jpa.KafkaMessageEntity;
import com.federated.ontology.searchRule.repository.jpa.KafkaMessageRepository;
import com.federated.ontology.searchRule.repository.jpa.ProcessingStatus;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
public class KafkaMessageStagingService {

    private final KafkaMessageRepository repository;

    public KafkaMessageStagingService(KafkaMessageRepository repository) {
        this.repository = repository;
    }

    @Transactional("jpaTransactionManager")
    public KafkaMessageEntity saveIncoming(KafkaMessage msg) {
        return saveIncoming(msg, null, null, null);
    }

    @Transactional("jpaTransactionManager")
    public KafkaMessageEntity saveIncoming(KafkaMessage msg,
                                            String topic,
                                            Integer partition,
                                            Long offset) {
        KafkaMessageEntity entity = new KafkaMessageEntity();
        entity.setKey(msg.getKey());
        entity.setAction(msg.getAction());
        entity.setMetaTypeModel(msg.getMetaTypeModel());
        entity.setParentTwinId(msg.getParentTwinId());
        entity.setMetadata(msg.getMetadata());
        entity.setFullMessage(msg.getFullMessage());
        entity.setStatus(ProcessingStatus.PENDING);
        entity.setReceivedAt(LocalDateTime.now());
        entity.setKafkaTopic(topic);
        entity.setKafkaPartition(partition);
        entity.setKafkaOffset(offset);

        KafkaMessageEntity saved = repository.save(entity);
        log.debug("[Staging] 저장 완료. id={}, key={}, action={}", saved.getId(), saved.getKey(), saved.getAction());
        return saved;
    }

    @Transactional("jpaTransactionManager")
    public void markStellioDone(Long id) {
        repository.findById(id).ifPresent(entity -> {
            entity.setStatus(ProcessingStatus.STELLIO_DONE);
            entity.setLastAttemptedAt(LocalDateTime.now());
            repository.save(entity);
        });
    }

    @Transactional("jpaTransactionManager")
    public void removeCompleted(Long id) {
        repository.deleteById(id);
        log.debug("[Staging] 완료 삭제. id={}", id);
    }

    @Transactional("jpaTransactionManager")
    public void markFailed(Long id, String errorMessage) {
        markFailedWithPhase(id, null, errorMessage);
    }

    @Transactional("jpaTransactionManager")
    public void markFailedWithPhase(Long id, String phase, String errorMessage) {
        repository.findById(id).ifPresent(entity -> {
            entity.setStatus(ProcessingStatus.FAILED);
            entity.setFailedPhase(phase);
            entity.setErrorMessage(errorMessage);
            entity.setRetryCount(entity.getRetryCount() + 1);
            entity.setProcessedAt(LocalDateTime.now());
            entity.setLastAttemptedAt(LocalDateTime.now());
            repository.save(entity);
        });
    }

    @Transactional("jpaTransactionManager")
    public void markDeadLetter(Long id, String reason) {
        repository.findById(id).ifPresent(entity -> {
            entity.setStatus(ProcessingStatus.DEAD_LETTER);
            entity.setErrorMessage(reason);
            entity.setProcessedAt(LocalDateTime.now());
            repository.save(entity);
        });
    }

    @Transactional("jpaTransactionManager")
    public void resetStuckRetrying(LocalDateTime stuckBefore) {
        List<KafkaMessageEntity> stuck = repository.findByStatus(ProcessingStatus.RETRYING);
        for (KafkaMessageEntity entity : stuck) {
            if (entity.getLastAttemptedAt() != null
                    && entity.getLastAttemptedAt().isBefore(stuckBefore)) {
                entity.setStatus(ProcessingStatus.FAILED);
                entity.setErrorMessage("RETRYING 타임아웃 — 자동 리셋");
                repository.save(entity);
                log.warn("[Staging] RETRYING 타임아웃 리셋. id={}", entity.getId());
            }
        }
    }

    public boolean isDuplicate(String topic, Integer partition, Long offset) {
        if (topic == null || partition == null || offset == null) return false;
        return repository.existsByKafkaTopicAndKafkaPartitionAndKafkaOffset(topic, partition, offset);
    }
}
