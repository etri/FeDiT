package kr.co.e8ight.ndxpro.agentManager.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.enums.ParameterIn;
import io.swagger.v3.oas.annotations.tags.Tag;
import kr.co.e8ight.ndxpro.agentManager.domain.dto.HistoryListResponseDto;
import kr.co.e8ight.ndxpro.agentManager.service.AgentHistoryService;
import kr.co.e8ight.ndxpro.agentManager.service.AgentStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@Tag(name = "Agent History Controller", description = "Flume Agent History API 그룹입니다.")
@Slf4j
@RequiredArgsConstructor
@RequestMapping("/ndxpro/v1/ingest")
public class AgentHistoryController {

    private final AgentHistoryService agentHistoryService;

    @GetMapping(value = "/histories")
    @Operation(summary = "Flume 에이전트 이력 조회 API")
    public ResponseEntity<HistoryListResponseDto> getHistories(@Parameter(description = "STATUS", in = ParameterIn.QUERY, example = "RUN") @RequestParam(value = "status", required = false) AgentStatus status,
                                                               @Parameter(description = "Agent ID", in = ParameterIn.QUERY, example = "1") @RequestParam(value = "agentId", required = false) Long agentId,
                                                               @Parameter(description = "조회할 페이지 번호, default : 0", in = ParameterIn.QUERY, example = "0") @RequestParam(value = "curPage", defaultValue = "0", required = false) Integer curPage,
                                                               @Parameter(description = "페이지 크기 , default : 10", in = ParameterIn.QUERY, example = "10") @RequestParam(value = "size", defaultValue = "10", required = false) Integer size) {
        Pageable pageable = PageRequest.of(curPage, size);
        return ResponseEntity.ok(agentHistoryService.getHistories(status, agentId, pageable));
    }
}
