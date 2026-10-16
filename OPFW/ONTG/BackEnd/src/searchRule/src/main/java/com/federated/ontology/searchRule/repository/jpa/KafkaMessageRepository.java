package com.federated.ontology.searchRule.repository.jpa;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface KafkaMessageRepository extends JpaRepository<KafkaMessageEntity, Long> {

    List<KafkaMessageEntity> findByStatus(ProcessingStatus status);

    List<KafkaMessageEntity> findByKey(String key);

    @Query(value = """
        SELECT * FROM kafka_message_staging
        WHERE status = 'FAILED'
          AND COALESCE(last_attempted_at, received_at) < :cutoff
        ORDER BY received_at ASC
        FOR UPDATE SKIP LOCKED
        """, nativeQuery = true)
    List<KafkaMessageEntity> findRetryTargets(@Param("cutoff") LocalDateTime cutoff,
                                               Pageable pageable);

    @Modifying
    @Query("UPDATE KafkaMessageEntity e SET e.status = :status, e.lastAttemptedAt = :now WHERE e.id IN :ids")
    int markRetryingBulk(@Param("ids") List<Long> ids,
                          @Param("status") ProcessingStatus status,
                          @Param("now") LocalDateTime now);

    long countByStatus(ProcessingStatus status);

    boolean existsByKafkaTopicAndKafkaPartitionAndKafkaOffset(
            String kafkaTopic, Integer kafkaPartition, Long kafkaOffset);
}
