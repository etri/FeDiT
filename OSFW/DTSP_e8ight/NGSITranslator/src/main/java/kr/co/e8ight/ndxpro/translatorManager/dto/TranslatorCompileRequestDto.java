package kr.co.e8ight.ndxpro.translatorManager.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

import javax.validation.constraints.NotEmpty;

@AllArgsConstructor
@NoArgsConstructor
@Getter
@Schema(description = "Translator 컴파일 요청 데이터")
public class TranslatorCompileRequestDto {
    @Schema(description = "Translator 이름", example = "VehicleTranslator")
    @NotEmpty(message = "Translator name Required.")
    private String name;

    @Schema(description = "Translator 자바 클래스, 클래스의 이름은 name과 같아야 함.")
    @NotEmpty(message = "Translator java class code Required.")
    private String translateCode;
}
