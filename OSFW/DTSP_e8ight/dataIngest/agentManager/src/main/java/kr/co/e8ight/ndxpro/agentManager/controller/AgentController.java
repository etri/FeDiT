package kr.co.e8ight.ndxpro.agentManager.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.enums.ParameterIn;
import io.swagger.v3.oas.annotations.tags.Tag;
import kr.co.e8ight.ndxpro.agentManager.domain.dto.AgentListResponseDto;
import kr.co.e8ight.ndxpro.agentManager.domain.dto.AgentResponseDto;
import kr.co.e8ight.ndxpro.agentManager.domain.dto.AgentRequestDto;
import kr.co.e8ight.ndxpro.agentManager.domain.dto.OperationRequestDto;
import kr.co.e8ight.ndxpro.agentManager.service.AgentService;
import kr.co.e8ight.ndxpro.agentManager.service.MemberService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.net.URI;

@RestController
@Tag(name = "Agent Management Controller", description = "Flume Agent 관리 API 그룹입니다.")
@Slf4j
@RequiredArgsConstructor
@RequestMapping("/ndxpro/v1/ingest")
public class AgentController {

    private final AgentService agentService;
    private final MemberService memberService;

    @PostMapping(value = "/agents")
    @Operation(summary = "데이터 수집용 Flume 에이전트 생성")
    public ResponseEntity<AgentResponseDto> createAgent(@RequestBody @Valid AgentRequestDto requestDto,
                                                        @RequestHeader("Authorization") String token) {
        log.info("Create agent name: {}", requestDto.getName());

        String memberId = memberService.getMemberId(token);
        AgentResponseDto responseDto = agentService.createAgent(requestDto, memberId);

        return ResponseEntity.created(URI.create("/agents/"+responseDto.getId())).body(responseDto);
    }

    @PatchMapping(value = "/agents/{agentId}")
    @Operation(summary = "Flume 에이전트 동작 (실행, 중지, 재실행)")
    public ResponseEntity<AgentResponseDto> operateAgent(
            @Parameter(description = "Agent ID", example = "1") @PathVariable("agentId") Long agentId,
            @RequestBody @Valid OperationRequestDto requestdto,
            @RequestHeader("Authorization") String token) {
        log.info(requestdto.getOperation() + " agent ID: {}", agentId);

        String memberId = memberService.getMemberId(token);
        return ResponseEntity.ok(agentService.operate(agentId, requestdto.getOperation(), memberId));
    }

    @DeleteMapping(value = "/agents/{agentId}")
    @Operation(summary = "Flume 에이전트 제거")
    public ResponseEntity<AgentResponseDto> deleteAgent(
            @Parameter(description = "Agent ID", example = "1") @PathVariable("agentId") Long agentId,
            @RequestHeader("Authorization") String token) {
        log.info("Remove agent ID: {}", agentId);

        String memberId = memberService.getMemberId(token);
        return ResponseEntity.ok(agentService.deleteAgent(agentId, memberId));
    }

    @GetMapping(value = "/agent/{agentId}")
    @Operation(summary = "Flume 에이전트 ID로 단건 조회")
    public ResponseEntity<AgentResponseDto> getAgent(
            @Parameter(description = "Agent ID", example = "1") @PathVariable("agentId") Long agentId) {
        return ResponseEntity.ok(agentService.getAgent(agentId));
    }

    @GetMapping(value = "/agent")
    @Operation(summary = "Flume 에이전트 이름으로 단건 조회")
    public ResponseEntity<AgentResponseDto> getAgentByName(
            @Parameter(description = "Agent name query", in = ParameterIn.QUERY, example = "VehicleAgent") @RequestParam(value = "name", required = false) String name) {
        return ResponseEntity.ok(agentService.getAgentByName(name));
    }

    @GetMapping(value = "/agents")
    @Operation(summary = "Flume 에이전트 리스트 조회")
    public ResponseEntity<AgentListResponseDto> getAgentList(
            @Parameter(description = "Agent status", in = ParameterIn.QUERY, example = "run") @RequestParam(value = "status", required = false) String status,
            @Parameter(description = "Agent name query", in = ParameterIn.QUERY, example = "vehicle") @RequestParam(value = "name", required = false) String name,
            @Parameter(description = "조회할 페이지 번호, default : 0", in = ParameterIn.QUERY, example = "0") @RequestParam(value = "curPage", defaultValue = "0", required = false) Integer curPage,
            @Parameter(description = "페이지 크기 , default : 10", in = ParameterIn.QUERY, example = "10") @RequestParam(value = "size", defaultValue = "10", required = false) Integer size) {
        Pageable pageable = PageRequest.of(curPage, size);
        return ResponseEntity.ok(agentService.getAgentList(name, status, pageable));
    }

    @PutMapping(value = "/agents/{agentId}")
    @Operation(summary = "Flume 에이전트 수정")
    public ResponseEntity<AgentResponseDto> updateAgent(
            @Parameter(description = "Agent ID", example = "1") @PathVariable("agentId") Long agentId,
            @RequestBody @Valid AgentRequestDto requestDto) {
        log.info("Update agent ID: {}", agentId);

        return ResponseEntity.ok(agentService.updateAgent(agentId, requestDto));
    }
}
