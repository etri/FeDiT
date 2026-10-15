package kr.co.e8ight.ndxpro.translatorManager.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import kr.co.e8ight.ndxpro.translatorManager.domain.Translator;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

import javax.validation.constraints.NotEmpty;
import javax.validation.constraints.NotNull;
import javax.validation.constraints.Pattern;

@AllArgsConstructor
@NoArgsConstructor
@Getter
@Schema(description = "Translator 생성 및 수정 요청 데이터")
public class TranslatorRegisterDto {
    @Schema(description = "Translator에 매칭될 Agent ID", example = "1")
    @NotNull(message = "Agent ID Required.")
    private Long agentId;

    @Schema(description = "Translator 이름", example = "VehicleTranslator")
    @NotEmpty(message = "Translator name Required.")
    private String name;

    @Schema(description = "Translator 자바 클래스, 클래스의 이름은 name과 같아야 함.")
    @NotEmpty(message = "Translator java class code Required.")
    private String translateCode;

    @Schema(description = "수집된 데이터의 모델 타입", example = "Vehicle")
    @NotEmpty(message = "Model type Required.")
    private String modelType;

    @Schema(description = "수집된 데이터의 context 정보", example = "http://context-server:43005/e8ight-context-v1.0.1.jsonld")
    @NotEmpty(message = "Context Required.")
    private String context;

    @Schema(description = "kafka source topic 사용자 설정 여부", example = "true")
    @NotNull(message = "CustomTopic status Required.")
    private Boolean isCustomTopic;

    @Schema(description = "kafka source topic", example = "lji.dev.pintel.simul.org2.vehicle.json")
    private String sourceTopic;

    @Schema(description = "kafka target topic. 미지정 시 translator.default.target-topic 을 사용한다.",
            example = "ngsild_topic")
    @Pattern(regexp = "[a-zA-Z0-9._-]{1,249}", message = "Invalid kafka target topic name.")
    private String targetTopic;

    @Schema(description = "ObservedAt Transfer Option", example = "true")
    private Boolean transferObservedAt = false;

    @Schema(description = "ObservedAt topic scenario ID (Integer)", example = "1")
    private Integer observedAtTopicScenarioId;

    @Schema(description = "ObservedAt topic scenario type", example = "TOD")
    private String observedAtTopicScenarioType;

    /**
     * 저장된 translator 로 builder 요청을 만든다. 코드는 그대로 두고 jar 만 다시 빌드할 때 쓴다.
     */
    public static TranslatorRegisterDto from(Translator translator) {
        return new TranslatorRegisterDto(
                translator.getAgentId(),
                translator.getName(),
                translator.getTranslateCode(),
                translator.getModelType(),
                translator.getContext(),
                translator.getIsCustomTopic(),
                translator.getSourceTopic(),
                translator.getTargetTopic(),
                translator.getTransferObservedAt(),
                translator.getObservedAtTopicScenarioId(),
                translator.getObservedAtTopicScenarioType());
    }
}
