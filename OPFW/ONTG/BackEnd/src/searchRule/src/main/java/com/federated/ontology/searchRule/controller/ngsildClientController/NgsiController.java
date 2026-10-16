package com.federated.ontology.searchRule.controller.ngsildClientController;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.federated.ontology.searchRule.dto.kafkaDto.InitResultDto;
import com.federated.ontology.searchRule.component.ApiResponse;
import com.federated.ontology.searchRule.dto.relationshipDto.TokenDicCache;
import com.federated.ontology.searchRule.service.ngsildClientService.NgsildClientService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Slf4j
@RestController
public class NgsiController {

    private final NgsildClientService ngsiLdClient;

    public NgsiController(NgsildClientService ngsiLdClient) {
        this.ngsiLdClient = ngsiLdClient;
    }

    @GetMapping("/api/v1/entities/{id}")
    public String getEntity(@PathVariable String id) {
        return ngsiLdClient.getEntity(id);
    }

    @GetMapping("/api/v1/entities")
    public String getEntities() {
        return ngsiLdClient.getEntities();
    }

    @DeleteMapping("/api/v1/entities")
    public String deleteEntities() {
        return ngsiLdClient.deleteEntities();
    }

    @GetMapping("/api/v1/entities/export")
    public ResponseEntity<byte[]> downloadAsJson() throws Exception {
        Map<String, Object> data = ngsiLdClient.rawDataDownload();

        ObjectMapper mapper = new ObjectMapper();
        String jsonString = mapper.writerWithDefaultPrettyPrinter().writeValueAsString(data);
        byte[] fileBytes = jsonString.getBytes(StandardCharsets.UTF_8);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setContentDisposition(ContentDisposition.attachment()
                .filename("search-result.json")
                .build());
        headers.setContentLength(fileBytes.length);

        return new ResponseEntity<>(fileBytes, headers, HttpStatus.OK);
    }

    @PostMapping("/api/v1/tokens/reload")
    public Map<String, Set<String>> reloadTokens() {
        return ngsiLdClient.loadLocalTokens();
    }

    @GetMapping("/api/v1/tokens/dictionary")
    public Map<String, Set<String>> getTokenDictionary() {
        Set<?> setSubject = TokenDicCache.getSubjects();
        Set<?> setKeyword = TokenDicCache.getKeywords();

        Map<String, Set<String>> dict = new HashMap<>();
        dict.put("subjects", (Set<String>) setSubject);
        dict.put("keywords", (Set<String>) setKeyword);

        return dict;
    }

    @PostMapping("/api/v1/imports/initial")
    public ResponseEntity<InitResultDto> importInitialData() {
        return ResponseEntity.ok(ngsiLdClient.setInit());
    }

    @GetMapping("/api/v1/fedit/digital-twins")
    public List<Map<String, Object>> getDigitalTwins() {
        return ngsiLdClient.getHttpDigitalTwin();
    }

    @GetMapping("/api/v1/fedit/digital-twins/{twinId}/digital-objects")
    public List<Map<String, Object>> getDigitalObjects(@PathVariable String twinId) {
        return ngsiLdClient.getHttpDigitalObject(twinId);
    }

    @PostMapping("/api/v1/ontology/imports")
    public ResponseEntity<ApiResponse<InitResultDto>> setOntologyInit() {
        log.info("온톨로지 초기화 프로세스 시작...");
        InitResultDto initResult = ngsiLdClient.setOntologyInit();
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(initResult));
    }

    @PostMapping("/api/v1/ontology/exports")
    public ResponseEntity<String> exportOwl() {
        ngsiLdClient.exportEntitiesToOwl();
        return ResponseEntity.accepted()
                .body("OWL export 작업 시작. 로그를 확인해주세요.");
    }
}
