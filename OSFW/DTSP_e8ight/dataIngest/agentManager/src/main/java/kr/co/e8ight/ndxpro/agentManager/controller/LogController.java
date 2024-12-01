package kr.co.e8ight.ndxpro.agentManager.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import kr.co.e8ight.ndxpro.agentManager.domain.dto.LogResponseDto;
import kr.co.e8ight.ndxpro.agentManager.service.AgentLogService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.lang.Nullable;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@Tag(name = "Agent Log Controller", description = "Flume Agent 로그 조회 API 그룹입니다.")
@Slf4j
@RequiredArgsConstructor
@RequestMapping("/ndxpro/v1/ingest")
public class LogController {

    private final AgentLogService agentLogService;

    @GetMapping(value = "/logs")
    @Operation(summary = "Flume 에이전트 로그 조회 API")
    public ResponseEntity<LogResponseDto> getLogger(
            @Parameter(description = "Agent ID") @RequestParam Long agentId,
            @Parameter(description = "로그 파일에서 읽기 시작할 라인 넘버") @RequestParam @Nullable Long startLineNum) {
        log.info("Get log Agent ID : {}", agentId);

        return ResponseEntity.ok(agentLogService.getLogByAgentId(agentId, startLineNum));
    }
}
