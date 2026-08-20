package kr.co.e8ight.ndxpro.translatorbuilder.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

@AllArgsConstructor
@NoArgsConstructor
@Getter
@Schema(description = "Translator 컴파일/빌드 요청 데이터")
public class TranslatorRegisterDto {
    @Schema(description = "연계 Data Source ID", example = "1")
    @NotNull(message = "Data Source ID Required.")
    private Long dataSourceId;

    @Schema(description = "Translator 자바 클래스, 클래스의 이름은 name과 같아야 함.")
    @NotEmpty(message = "Translator java class code Required.")
    private String translateCode;

    @Schema(description = "수집된 데이터의 모델 타입", example = "Vehicle")
    @NotEmpty(message = "Model type Required.")
    private String modelType;
}
