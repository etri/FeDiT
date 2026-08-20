package kr.co.e8ight.ndxpro.translatorManager.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import kr.co.e8ight.ndxpro.translatorManager.service.TranslatorService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

@RestController
@Tag(name = "Translator Signal Controller", description = "Translator 신호 처리 API 그룹입니다.")
@RequestMapping("/ndxpro/v1/translator")
@RequiredArgsConstructor
@Slf4j
public class SignalController {

    private final TranslatorService translatorService;

    @GetMapping("/signal")
    @Operation(summary = "Translator로부터 신호를 받을 API")
    public String receiveSignal(@RequestParam String type, @RequestParam Long translatorId) {
        log.debug("Signal Recieved, Translator Id : " + translatorId + " type : " + type);
        translatorService.updateLastSignalDatetime(type, translatorId);
        return "OK";
    }

    @GetMapping("/stopAgent")
    @Operation(summary = "Translator로부터 신호를 받을 API")
    public String receiveSignal(@RequestParam Long agentId, @RequestParam Long translatorId) {
        log.info("Signal Recieved, Agent Id : {} will be stoped by Translator Id : {}", agentId, translatorId);
        // agent 정지는 현재 비활성 상태다. 다시 켤 때는 하드코딩된 토큰이 아니라
        // 호출자의 Authorization 헤더를 받아 translatorService.stopAgent(agentId, token) 로 넘길 것.
        return "OK";
    }
}
