package kr.co.e8ight.ndxpro.translatorManager.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.enums.ParameterIn;
import io.swagger.v3.oas.annotations.tags.Tag;
import kr.co.e8ight.ndxpro.translatorManager.dto.*;
import kr.co.e8ight.ndxpro.translatorManager.service.TranslatorService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.net.URI;

@RestController
@Tag(name = "Translator Management Controller", description = "NGSI Translator 관리 API 그룹입니다.")
@RequestMapping("/ndxpro/v1/translator")
@RequiredArgsConstructor
@Slf4j
public class TranslatorController {

    private final TranslatorService translatorService;

    @PostMapping("/translators/compile")
    @Operation(summary = "Translator 컴파일")
    public ResponseEntity<ProcessResultDto> compileTranslator(@RequestBody @Valid TranslatorCompileRequestDto translatorRegisterDto,
                                                              @RequestHeader("Authorization") String token) {
        return translatorService.compile(translatorRegisterDto, token);
    }

    @PostMapping("/translators")
    @Operation(summary = "Translator 생성")
    public ResponseEntity<TranslatorResponseDto> registerTranslator(@RequestBody @Valid TranslatorRegisterDto translatorRegisterDto,
                                                                    @RequestHeader("Authorization") String token) {
        TranslatorResponseDto responseDto = translatorService.register(translatorRegisterDto, token);
        return ResponseEntity.created(URI.create("/translators/"+responseDto.getId())).body(responseDto);
    }

    @GetMapping("/translators/{translatorId}")
    @Operation(summary = "Translator 단건 조회")
    public ResponseEntity<TranslatorResponseDto> getTranslator(
            @Parameter(description = "Translator ID", example = "1", required = true) @PathVariable("translatorId") Long translatorId) {
        return ResponseEntity.ok(TranslatorResponseDto.from(translatorService.getById(translatorId)));
    }

    @GetMapping(value = "/translators")
    @Operation(summary = "Translator 목록 조회")
    public ResponseEntity<TranslatorListResponseDto> getTranslatorInfoList(
            @Parameter(description = "Agent ID", example = "1") @RequestParam(value = "agentId", required = false) Long agentId,
            @Parameter(description = "조회할 페이지 번호, default : 0", in = ParameterIn.QUERY, example = "0") @RequestParam(value = "curPage", defaultValue = "0", required = false) Integer curPage,
            @Parameter(description = "페이지 크기 , default : 10", in = ParameterIn.QUERY, example = "10") @RequestParam(value = "size", defaultValue = "10", required = false) Integer size
    ) {
        Pageable pageable = PageRequest.of(curPage, size);
        return ResponseEntity.ok(translatorService.getTranslatorList(agentId, pageable));
    }

    @DeleteMapping("/translators/{translatorId}")
    @Operation(summary = "Translator 제거")
    public ResponseEntity<TranslatorResponseDto> deleteTranslator(
            @Parameter(description = "Translator ID", example = "1", required = true) @PathVariable("translatorId") Long translatorId,
            @RequestHeader("Authorization") String token
            ) {
        log.info("Remove Translator ID: {}", translatorId);

        return ResponseEntity.ok(translatorService.delete(translatorId, token));
    }

    @PutMapping("/translators/{translatorId}")
    @Operation(summary = "Translator 수정")
    public ResponseEntity<TranslatorResponseDto> updateTranslator(
            @Parameter(description = "Translator ID", example = "1", required = true) @PathVariable("translatorId") Long translatorId,
            @RequestBody @Valid TranslatorRegisterDto translatorRegisterDto,
            @RequestHeader("Authorization") String token) {
        log.info("Update Translator ID: {}", translatorId);

        return ResponseEntity.ok(translatorService.update(translatorId, translatorRegisterDto, token));
    }

    @PatchMapping("/translators/{translatorId}")
    @Operation(summary = "Translator 작업 (실행, 중지, 재실행)")
    public ResponseEntity<TranslatorResponseDto> operateTranslator(
            @Parameter(description = "Translator ID", example = "1", required = true) @PathVariable("translatorId") Long translatorId,
            @RequestBody @Valid OperationRequestDto requestdto,
            @RequestHeader("Authorization") String token) {
        log.info(requestdto.getOperation() + " Translator ID:{}", translatorId);

        return ResponseEntity.ok(translatorService.operate(translatorId, requestdto.getOperation(), token));
    }

    @PostMapping("/translators-test/{translatorId}")
    @Operation(summary = "Translator 검증")
    public ResponseEntity<TranslatorCheckResponseDto> checkTranslator(
            @Parameter(description = "Translator ID", example = "1", required = true) @PathVariable("translatorId") Long translatorId,
            @RequestBody @Valid TranslatorCheckRequestDto requestdto,
            @RequestHeader("Authorization") String token) {
        return ResponseEntity.ok(translatorService.check(translatorId, requestdto, token));
    }

    @GetMapping("/translators/sample")
    @Operation(summary = "Translator sample code")
    public ResponseEntity<String> getSampleTranslatorCode(
            @Parameter(description = "Translator name", example = "TestTranslator", required = true) @RequestParam("name") String name
    ) {
        return ResponseEntity.ok(translatorService.getSampleCode(name));
    }
}
