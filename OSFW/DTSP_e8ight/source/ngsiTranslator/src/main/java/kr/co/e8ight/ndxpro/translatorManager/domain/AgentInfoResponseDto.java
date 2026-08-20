package kr.co.e8ight.ndxpro.translatorManager.domain;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@AllArgsConstructor
@NoArgsConstructor
public class AgentInfoResponseDto {

    @Schema(description = "Agent ID")
    private Long id;

    @Schema(description = "Agent kafka target topic")
    private String topic;
}