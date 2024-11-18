package kr.co.e8ight.ndxpro.translatorManager.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import kr.co.e8ight.ndxpro.translatorManager.dto.HistoryListResponseDto;
import kr.co.e8ight.ndxpro.translatorManager.service.TranslatorHistoryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@Tag(name = "Translator History Controller", description = "Translator History API 그룹입니다.")
@Slf4j
@RequiredArgsConstructor
@RequestMapping("/ndxpro/v1/translator")
public class TranslatorHistoryController {

    private final TranslatorHistoryService translatorHistoryService;

    @GetMapping(value = "/histories")
    @Operation(summary = "Translator 이력 조회 API")
    public ResponseEntity<HistoryListResponseDto> getHistories() {
        return ResponseEntity.ok(translatorHistoryService.getHistories());
    }
}
