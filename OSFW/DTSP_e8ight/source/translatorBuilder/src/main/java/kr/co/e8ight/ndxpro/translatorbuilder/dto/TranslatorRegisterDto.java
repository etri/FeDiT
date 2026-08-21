package kr.co.e8ight.ndxpro.translatorbuilder.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

import javax.validation.constraints.NotEmpty;
import javax.validation.constraints.NotNull;

@AllArgsConstructor
@NoArgsConstructor
@Getter
@Schema(description = "Translator 컴파일/빌드 요청 데이터")
public class TranslatorRegisterDto {
    @Schema(description = "연계 Flume Agent ID", example = "1")
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
}
