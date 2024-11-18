package kr.co.e8ight.ndxpro_v1_datamanager.controller;


import com.fasterxml.jackson.core.JsonProcessingException;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import java.io.IOException;
import java.util.List;
import kr.co.e8ight.ndxpro_v1_datamanager.dto.requestDto.ContextRequestDto;
import kr.co.e8ight.ndxpro_v1_datamanager.dto.responseDto.ContextResponseDto;
import kr.co.e8ight.ndxpro_v1_datamanager.service.ContextService;
import lombok.extern.slf4j.Slf4j;
import org.json.simple.parser.ParseException;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RestController
@RequestMapping("/ndxpro/v1/manager")
public class ContextController {

    private final ContextService contextService;

    public ContextController(ContextService contextService) {
        this.contextService = contextService;
    }

    @PostMapping(value = "/contexts")
    @Operation(summary = "custom context 생성", description ="")
    public Object createContext(
            @Parameter(description = "contextUrl : URL + .jsonld 형식")
            @RequestBody ContextRequestDto contextRequestDto)
            throws IOException, ParseException {
        log.info("Method createContext request msg='{}'" + contextRequestDto);

        System.out.println(contextRequestDto.getValue());
        return contextService.createContext(contextRequestDto);
    }

    @PostMapping(value = "/contexts/import")
    @Operation(summary = "기존 context 임포트", description = "URL 임포트")
    public Object importContext(
            @RequestParam(defaultValue = "https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld") String contextUrl) throws JsonProcessingException {
        log.info("Method importContext request msg='{}'" + contextUrl);
        return contextService.importContext(contextUrl);
    }


    @GetMapping(value = "/contexts")
    @Operation(summary = "context 전체 조회",description = "")
    public List<String> readContexts() {
        log.info("Method readContexts request msg='{}'");
        return contextService.readAllContext();

    }

    @GetMapping(value = "/contexts/version")
    @Operation(summary = "context version 조회")
    public List<ContextResponseDto> readContextVersion(
            @Parameter(description = "contextUrl : URL + .jsonld 형식")
            @RequestParam(defaultValue = "http://172.16.28.220:3005/e8ight-context.jsonld") String contextUrl) {
        log.info("Method readContextVersion request msg='{}'" + contextUrl);
        return contextService.readContextVersion(contextUrl);

    }
    @GetMapping(value = "/context")
    @Operation(summary = "context 단건 조회")
    public ContextResponseDto readContext(
            @Parameter(description = "contextUrl : URL + .jsonld 형식")
            @RequestParam(defaultValue = "http://172.16.28.220:3005/e8ight-context-v1.01.jsonld")String contextUrl,
            @RequestParam(defaultValue = "true") Boolean full
    ) {
        log.info("Method readContext request msg='{}'" + contextUrl);
        return contextService.readContext(contextUrl,full);
    }

    @GetMapping(value = "/context/v1")
    @Operation(summary = "context 버전1 모음 조회")
    public List<ContextResponseDto> readContextFirstVersion(
    ) {
        log.info("Method readContextFirstVersion request msg='{}'");
        return contextService.readContextFirstVersion();
    }

    @PutMapping("/contexts/readiness")
    @Operation(summary = "context 준비 상태 변경")
    public String updateContextIsReady(
            @RequestParam(defaultValue = "http://172.16.28.220:3005/e8ight-context-v1.01.jsonld")String contextUrl) {
        log.info("Method updateContextIsReady request msg='{}'" + contextUrl);
        return contextService.updateContextIsReady(contextUrl);

    }

    @PutMapping(value = "/contexts/models/enrollment")
    @Operation(summary = "context 수정(데이터 모델 등록)", description =
            "DataModel 사용 준비 완료 여부 확인")
    public Object registrationDataModelInContext(
            @RequestParam(defaultValue = "http://172.16.28.220:3005/e8ight-context-v1.01.jsonld") String contextUrl
            ,@RequestBody List<String> dataModels)
            throws IOException, ParseException {
        log.info("Method registrationDataModelInContext request msg='{}'" + contextUrl + dataModels);
        return contextService.registrationDataModelInContext(contextUrl,dataModels);

    }

    @PutMapping(value = "/contexts/models/un-enrollment")
    @Operation(summary = "context 수정(데이터 모델 등록 취소)", description =
            "DataModel 사용 중 여부 확인")
    public String unRegistrationDataModelInContext(
            @RequestParam(defaultValue = "http://172.16.28.220:3005/e8ight-context-v1.01.jsonld") String contextUrl ,
            @RequestBody List<String> dataModels)
            throws IOException, ParseException {
        log.info("Method unRegistrationDataModelInContext request msg='{}'" + contextUrl + dataModels);
        return contextService.unRegistrationDataModelInContext(contextUrl,dataModels);

    }

    @DeleteMapping(value = "/contexts")
    @Operation(summary = "context 삭제", description ="DataModel 등록 여부 확인" )
    public String deleteContext(
            @Parameter(description = "contextUrl : URL + .jsonld 형식")
            @RequestParam(defaultValue = "http://172.16.28.220:3005/e8ight-context-v1.01.jsonld")
            String contextUrl) {
        log.info("Method deleteContext request msg='{}'" + contextUrl);
        return contextService.deleteContext(contextUrl);

    }

}
