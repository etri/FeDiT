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

    @Setter
    private String targetTopic;

    /**
     * source topic 을 사용자가 직접 지정했는지 여부. 이 컬럼이 생기기 전 translator 는 null 이다.
     * 직접 지정했다면 다른 agent 가 수집한 데이터를 일부러 쓰는 경우일 수 있어 agent 필터를 끈다.
     */
    private Boolean isCustomTopic;

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

    public Translator(Long agentId, String name, String translateCode, String context, String modelType, TranslatorStatus status, String sourceTopic, String targetTopic, Boolean transferObservedAt, Integer observedAtTopicScenarioId, String observedAtTopicScenarioType, Boolean isReady, String createdBy, String modifiedBy) {
        this.agentId = agentId;
        this.name = name;
        this.translateCode = translateCode;
        this.context = context;
        this.modelType = modelType;
        this.status = status;
        this.sourceTopic = sourceTopic;
        this.targetTopic = targetTopic;
        this.transferObservedAt = transferObservedAt;
        this.observedAtTopicScenarioId = observedAtTopicScenarioId;
        this.observedAtTopicScenarioType = observedAtTopicScenarioType;
        this.isReady = isReady;
        this.createdBy = createdBy;
        this.modifiedBy = modifiedBy;
    }

    public static Translator create(TranslatorRegisterDto translatorRegisterDto, String creator) {
        Translator translator = new Translator(translatorRegisterDto.getAgentId(),
                translatorRegisterDto.getName(),
                translatorRegisterDto.getTranslateCode(),
                translatorRegisterDto.getContext(),
                translatorRegisterDto.getModelType(),
                TranslatorStatus.CREATED,
                translatorRegisterDto.getSourceTopic(),
                translatorRegisterDto.getTargetTopic(),
                translatorRegisterDto.getTransferObservedAt(),
                translatorRegisterDto.getObservedAtTopicScenarioId(),
                translatorRegisterDto.getObservedAtTopicScenarioType(),
                //todo 임시 true
                true,
                creator,
                creator
                );
        translator.isCustomTopic = translatorRegisterDto.getIsCustomTopic();
        return translator;
    }

    public void update(TranslatorRegisterDto translatorRegisterDto, String memberId) {
        this.name = translatorRegisterDto.getName();
        this.translateCode = translatorRegisterDto.getTranslateCode();
        this.modelType = translatorRegisterDto.getModelType();
        // context 는 modelType 과 한 쌍이다. 같이 갱신하지 않으면 실행 시 옛 모델의 context 로 뜬다.
        this.context = translatorRegisterDto.getContext();
        this.isCustomTopic = translatorRegisterDto.getIsCustomTopic();
        this.modifiedBy = memberId;
    }

    /**
     * runner 가 다른 agent 의 메시지(ndx-agent-id 헤더가 다른 메시지)를 건너뛸지 여부.
     * agent 의 토픽을 그대로 쓰는 translator 만 켠다. 직접 지정한 토픽이거나,
     * 설정 여부를 모르는 이전 translator(null)는 지금까지처럼 토픽의 모든 메시지를 받는다.
     */
    public boolean isAgentFilterEnabled() {
        return Boolean.FALSE.equals(this.isCustomTopic);
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
