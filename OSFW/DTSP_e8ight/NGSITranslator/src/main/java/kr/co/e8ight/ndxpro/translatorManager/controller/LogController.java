package kr.co.e8ight.ndxpro.translatorManager.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import kr.co.e8ight.ndxpro.translatorManager.dto.LogResponseDto;
import kr.co.e8ight.ndxpro.translatorManager.service.TranslatorLogService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.lang.Nullable;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@Tag(name = "Translator Log Controller", description = "Translator 로그 조회 API 그룹입니다.")
@RequestMapping("/ndxpro/v1/translator")
@Slf4j
@RequiredArgsConstructor
public class LogController {

    private final TranslatorLogService translatorLogService;

    @GetMapping(value = "/logs")
    @Operation(summary = "Translator 로그 조회")
    public ResponseEntity<LogResponseDto> getLogger(
            @Parameter(description = "Translator ID", required = true) @RequestParam Long translatorId,
            @Parameter(description = "로그 파일에서 읽기 시작할 라인 넘버") @RequestParam @Nullable Long startLineNum) {
        log.info("Get log Agent ID : {}", translatorId);

        return ResponseEntity.ok(translatorLogService.getLogById(translatorId, startLineNum));
    }
}