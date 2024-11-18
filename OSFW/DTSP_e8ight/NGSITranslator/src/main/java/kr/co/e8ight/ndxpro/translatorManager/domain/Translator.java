package kr.co.e8ight.ndxpro.translatorManager.domain;

import kr.co.e8ight.ndxpro.translatorManager.dto.TranslatorRegisterDto;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import javax.persistence.*;
import javax.persistence.Entity;
import java.time.LocalDateTime;

@Entity
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Table(schema = "ngsi_translator")
@EntityListeners(AuditingEntityListener.class)
public class Translator {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long agentId;

    @Column(unique = true)
    @Setter
    private String name;

    @Column(columnDefinition = "TEXT")
    private String translateCode;

    private String context;

    private String modelType;

    @Setter
    @Enumerated(EnumType.STRING)
    private TranslatorStatus status;

    @Setter
    private Integer pid;

    @Setter
    private LocalDateTime lastSignalDatetime;

    @Setter
    private String sourceTopic;

    private String targetTopic;

    private Boolean transferObservedAt;

    private Integer observedAtTopicScenarioId;

    private String observedAtTopicScenarioType;

    private Boolean isReady;

    @CreatedDate
    private LocalDateTime createdAt;

    private String createdBy;

    @LastModifiedDate
    private LocalDateTime modifiedAt;

    private String modifiedBy;

    public Translator(Long agentId, String name, String translateCode, String context, String modelType, TranslatorStatus status, String sourceTopic, Boolean transferObservedAt, Integer observedAtTopicScenarioId, String observedAtTopicScenarioType, Boolean isReady, String createdBy, String modifiedBy) {
        this.agentId = agentId;
        this.name = name;
        this.translateCode = translateCode;
        this.context = context;
        this.modelType = modelType;
        this.status = status;
        this.sourceTopic = sourceTopic;
        this.targetTopic = "ngsild_topic_" + Math.toIntExact(agentId % 10);
        this.transferObservedAt = transferObservedAt;
        this.observedAtTopicScenarioId = observedAtTopicScenarioId;
        this.observedAtTopicScenarioType = observedAtTopicScenarioType;
        this.isReady = isReady;
        this.createdBy = createdBy;
        this.modifiedBy = modifiedBy;
    }

    public static Translator create(TranslatorRegisterDto translatorRegisterDto, String creator) {
        return new Translator(translatorRegisterDto.getAgentId(),
                translatorRegisterDto.getName(),
                translatorRegisterDto.getTranslateCode(),
                translatorRegisterDto.getContext(),
                translatorRegisterDto.getModelType(),
                TranslatorStatus.CREATED,
                translatorRegisterDto.getSourceTopic(),
                translatorRegisterDto.getTransferObservedAt(),
                translatorRegisterDto.getObservedAtTopicScenarioId(),
                translatorRegisterDto.getObservedAtTopicScenarioType(),
                //todo 임시 true
                true,
                creator,
                creator
                );
    }

    public void update(TranslatorRegisterDto translatorRegisterDto, String memberId) {
        this.name = translatorRegisterDto.getName();
        this.translateCode = translatorRegisterDto.getTranslateCode();
        this.modelType = translatorRegisterDto.getModelType();
        this.modifiedBy = memberId;
    }

    public String getFileName() {
        return this.id + "_" + this.name;
    }

    public void updateLastSignalDatetime() {
        this.setLastSignalDatetime(LocalDateTime.now());
    }

    public void delete(String modifier) {
        this.modifiedBy = modifier;
        this.status = TranslatorStatus.DELETED;
    }

    public void ready() {
        this.isReady = true;
    }
}
