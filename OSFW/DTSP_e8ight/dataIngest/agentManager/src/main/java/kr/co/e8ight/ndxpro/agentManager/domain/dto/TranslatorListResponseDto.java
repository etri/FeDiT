package kr.co.e8ight.ndxpro.agentManager.domain.dto;


import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
@Schema(description = "Translator 목록 조회 응답 데이터")
public class TranslatorListResponseDto {
    @Schema(description = "Translator 목록")
    @JsonProperty(value = "data")
    private List<TranslatorResponseDto> translatorList = new ArrayList<>();
}
