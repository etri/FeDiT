package kr.co.e8ight.ndxpro.translatorManager.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

import javax.validation.constraints.NotEmpty;

@NoArgsConstructor
@AllArgsConstructor
@Getter
@Schema(description = "Translator 검증 요청 데이터")
public class TranslatorCheckRequestDto {
    @NotEmpty(message = "Sample JSON Required.")
    @Schema(description = "Translator 검증에 사용할 테스트 json 데이터")
    private String sampleJson;
}
