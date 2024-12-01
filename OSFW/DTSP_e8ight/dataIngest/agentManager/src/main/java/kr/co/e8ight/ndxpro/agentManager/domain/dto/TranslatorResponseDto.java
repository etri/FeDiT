package kr.co.e8ight.ndxpro.agentManager.domain.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Translator 정보 응답 데이터")
public class TranslatorResponseDto {

    @Schema(description = "Translator ID")
    private Long id;

    @Schema(description = "연계 Agent ID")
    private Long agentId;
}