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
    public String receiveSignal(@RequestParam Long agentId, @RequestParam Long translatorId,
                                @RequestHeader("Authorization") String token) {
        log.info("Signal Recieved, Agent Id : {} will be stoped by Translator Id : {}", agentId, translatorId);
        translatorService.stopAgent(agentId, token);
        return "OK";
    }
}
