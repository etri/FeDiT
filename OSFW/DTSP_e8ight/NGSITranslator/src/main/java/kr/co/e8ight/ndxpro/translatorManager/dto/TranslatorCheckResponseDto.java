package kr.co.e8ight.ndxpro.translatorManager.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@Schema(description = "Translator 검증 응답 데이터")
public class TranslatorCheckResponseDto {
    @Schema(description = "Translator 검증 성공 여부")
    boolean isSuccess;

    @Schema(description = "Translator 검증 출력 메시지")
    String message;
}


