package kr.co.e8ight.ndxpro.agentManager.domain.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class LogResponseDto {
    @Schema(description = "Log 내용")
    private String log;

    @Schema(description = "로그 파일에서 마지막으로 읽은 라인 넘버")
    private Long endLineNum;
}
