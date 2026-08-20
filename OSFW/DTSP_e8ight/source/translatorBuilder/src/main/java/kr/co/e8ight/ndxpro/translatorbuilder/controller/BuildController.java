package kr.co.e8ight.ndxpro.translatorbuilder.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import kr.co.e8ight.ndxpro.translatorbuilder.dto.TranslatorCompileRequestDto;
import kr.co.e8ight.ndxpro.translatorbuilder.dto.TranslatorRegisterDto;
import kr.co.e8ight.ndxpro.translatorbuilder.dto.ProcessResultDto;
import kr.co.e8ight.ndxpro.translatorbuilder.service.BuildService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;

@RestController
@Tag(name = "Translator Builder Controller", description = "Data Translator 빌드 API 그룹입니다.")
@Slf4j
@RequestMapping("/ndxpro/v1/translator-builder")
public class BuildController {

    @Autowired
    private BuildService buildService;

    @PostMapping("/compile")
    @Operation(summary = "데이터 Translator 컴파일")
    public ResponseEntity<ProcessResultDto> compileTranslator(@RequestBody @Valid TranslatorCompileRequestDto translatorCompileRequestDto) {
        return ResponseEntity.ok(buildService.compile(translatorCompileRequestDto));
    }

    @PostMapping("/build")
    @Operation(summary = "데이터 Translator Jar 빌드")
    public ResponseEntity<ProcessResultDto> buildTranslator(@RequestBody @Valid TranslatorRegisterDto translatorRegisterDto) {
        ProcessResultDto resultDto = buildService.build(translatorRegisterDto);
        return ResponseEntity.ok(resultDto);
    }

    @GetMapping("/health-check")
    public ResponseEntity<Void> healthCheck() {
        log.info("OK");
        return new ResponseEntity<>(HttpStatus.OK);
    }
}
