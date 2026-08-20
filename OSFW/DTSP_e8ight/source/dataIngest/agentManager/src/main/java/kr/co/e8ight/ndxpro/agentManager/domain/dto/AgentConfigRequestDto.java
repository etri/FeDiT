package kr.co.e8ight.ndxpro.agentManager.domain.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import javax.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.ToString;

@AllArgsConstructor
@NoArgsConstructor
@Getter
@ToString
@Builder
public class AgentConfigRequestDto {

    @NotEmpty(message = "Config file contents Required.")
    @Schema(description = "직접 편집한 flume conf 파일 전체 내용")
    private String confFileContents;
}
