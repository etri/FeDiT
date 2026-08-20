package kr.co.e8ight.ndxpro.translatorManager.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import kr.co.e8ight.ndxpro.translatorManager.domain.Translator;
import kr.co.e8ight.ndxpro.translatorManager.domain.TranslatorStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import javax.validation.constraints.NotNull;
import java.time.LocalDateTime;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Translator 정보 응답 데이터")
public class TranslatorResponseDto {

    @Schema(description = "Translator ID")
    private Long id;

    @Schema(description = "연계 Agent ID")
    private Long agentId;

    @Schema(description = "Translator 이름")
    private String name;

    @Schema(description = "Translator 자바 클래스 코드")
    private String translateCode;

    @Schema(description = "수집 데이터 모델 타입")
    private String modelType;

    @Schema(description = "Translator 상태")
    private TranslatorStatus status;

    @Schema(description = "실행중인 Translator 프로세스의 PID")
    private Integer pid;

    @Schema(description = "Translator 마지막 신호 시점")
    private LocalDateTime lastSignalDatetime;

    @Schema(description = "Kafka source topic")
    private String sourceTopic;

    @Schema(description = "Kafka target topic")
    private String targetTopic;

    @Schema(description = "ObservedAt Transfer Option", example = "true")
    @NotNull(message = "ObservedAt Transfer Option Required.")
    private Boolean transferObservedAt;

    @Schema(description = "ObservedAt topic scenario ID")
    private Integer observedAtTopicScenarioId;

    @Schema(description = "ObservedAt topic scenario type")
    private String observedAtTopicScenarioType;

    @Schema(description = "검증 완료 여부")
    private Boolean isReady;

    @Schema(description = "Translator 생성 Datetime")
    private LocalDateTime createdAt;

    @Schema(description = "마지막 Translator 수정 Datetime")
    private LocalDateTime modifiedAt;

    public static TranslatorResponseDto from(Translator translator) {
        return TranslatorResponseDto.builder()
                .id(translator.getId())
                .agentId(translator.getAgentId())
                .name(translator.getName())
                .translateCode(translator.getTranslateCode())
                .modelType(translator.getModelType())
                .status(translator.getStatus())
                .pid(translator.getPid())
                .lastSignalDatetime(translator.getLastSignalDatetime())
                .sourceTopic(translator.getSourceTopic())
                .targetTopic(translator.getTargetTopic())
                .transferObservedAt(translator.getTransferObservedAt())
                .observedAtTopicScenarioId(translator.getObservedAtTopicScenarioId())
                .observedAtTopicScenarioType(translator.getObservedAtTopicScenarioType())
                .isReady(translator.getIsReady())
                .createdAt(translator.getCreatedAt())
                .modifiedAt(translator.getModifiedAt())
                .build();
    }
}
