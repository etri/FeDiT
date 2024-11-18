package kr.co.e8ight.ndxpro.agentManager.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import kr.co.e8ight.ndxpro.agentManager.service.AgentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@Tag(name = "Agent Signal Controller", description = "Flume Agent로부터 신호를 받는 API 그룹입니다.")
@RequiredArgsConstructor
@Slf4j
@RequestMapping("/ndxpro/v1/ingest")
public class SignalController {

    private final AgentService agentService;

    @GetMapping("/signal")
    @Operation(summary = "Flume 에이전트로부터 신호를 받을 API")
    public String receiveSignal(@RequestParam String type, @RequestParam Long agentId) {
        log.debug("Signal Recieved, Agent Id : " + agentId + " type : " + type);
        agentService.updateLastSignalDatetime(type, agentId);
        return "OK";
    }
}
