package com.federated.ontology.searchRule.repository.jpa;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.Map;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "kafka_message_staging")
public class KafkaMessageEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "key", length = 255)
    private String key;

    @Column(length = 20)
    private String action;

    @Column(length = 50)
    private String metaTypeModel;

    @Column(length = 255)
    private String parentTwinId;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private Map<String, Object> metadata;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private Map<String, Object> fullMessage;

    @Enumerated(EnumType.STRING)
    @Column(length = 20, nullable = false)
    private ProcessingStatus status;

    @Column(columnDefinition = "text")
    private String errorMessage;

    @Column(nullable = false)
    private LocalDateTime receivedAt;

    private LocalDateTime processedAt;

    @Column(nullable = false, columnDefinition = "integer default 0")
    private int retryCount = 0;

    @Column(name = "failed_phase", length = 20)
    private String failedPhase;

    private LocalDateTime lastAttemptedAt;

    @Column(name = "kafka_topic", length = 255)
    private String kafkaTopic;

    @Column(name = "kafka_partition")
    private Integer kafkaPartition;

    @Column(name = "kafka_offset")
    private Long kafkaOffset;
}
