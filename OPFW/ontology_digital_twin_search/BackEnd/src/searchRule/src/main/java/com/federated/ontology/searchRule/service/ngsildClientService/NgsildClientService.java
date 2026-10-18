package com.federated.ontology.searchRule.service.ngsildClientService;

import com.federated.ontology.searchRule.dto.kafkaDto.InitResultDto;
import com.federated.ontology.searchRule.component.ApiResponse;
import com.federated.ontology.searchRule.dto.kafkaDto.DigitalTwinMetaInfo;
import org.springframework.http.ResponseEntity;

import java.net.http.HttpHeaders;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;

public interface NgsildClientService {
    void saveNgsiLdEntity(String jsonEntity);
    void exportEntitiesToOwl();
    Map<String, Set<String>> loadLocalTokens();
    String getEntity(String entityId);
    String getEntities();
    String deleteEntities();
    String updateEntity(Map<String, Object> metaInfo);

    String updateDigitalTwinEntity(Map<String, Object> metadata, String key);

    String updateDigitalObjectEntity(Map<String, Object> metadata, String key, String parentTwinId);

    InitResultDto setInit();
    Map<String, Object> rawDataDownload();
    List<Map<String, Object>> getHttpDigitalTwin();
    List<Map<String, Object>> getFileIODigitalTwin();
    List<Map<String, Object>> getHttpDigitalObject(String twinId);
    List<Map<String, Object>> getFileIODigitalObject(String twinId);
    InitResultDto setOntologyInit();
}
