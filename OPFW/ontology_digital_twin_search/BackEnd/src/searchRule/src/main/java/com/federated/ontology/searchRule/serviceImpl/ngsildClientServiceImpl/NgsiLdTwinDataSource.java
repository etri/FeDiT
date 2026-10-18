package com.federated.ontology.searchRule.serviceImpl.ngsildClientServiceImpl;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.io.File;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Component
public class NgsiLdTwinDataSource {

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    public NgsiLdTwinDataSource(RestTemplate restTemplate, ObjectMapper objectMapper) {
        this.restTemplate = restTemplate;
        this.objectMapper = objectMapper;
    }

    public List<Map<String, Object>> loadDigitalTwins(boolean useHttp) {
        if (useHttp) {
            return getHttpDigitalTwin();
        }
        return getFileIODigitalTwin();
    }

    public List<Map<String, Object>> loadDigitalObjects(boolean useHttp, String twinId) {
        if (useHttp) {
            return getHttpDigitalObject(twinId);
        }
        return getFileIODigitalObject(twinId);
    }

    public Map<String, Object> rawDataDownload() {
        Map<String, Object> result = new LinkedHashMap<>();
        List<Map<String, Object>> twinDataList = getHttpDigitalTwin();

        List<Map<String, Object>> twinObjectList;
        Map<String, Object> twinObjectData = new LinkedHashMap<>();

        String twinId;
        for (Map<String, Object> twin : twinDataList) {
            twinId = twin.get("digital_twin_id") != null
                    ? twin.get("digital_twin_id").toString()
                    : "UNKNOWN_ID";

            twinObjectList = getHttpDigitalObject(twinId);
            twinObjectData.put(twinId, twinObjectList);
        }

        result.put("twinData", twinDataList);
        result.put("twinObjectData", twinObjectData);

        System.out.println(result.toString());
        return result;
    }

    public List<Map<String, Object>> getHttpDigitalTwin() {
        String url = "http://{fedtApiIp}:{fedtApiPort}/fedit/v1/digital-twins";

        HttpEntity<String> entity = new HttpEntity<>(new org.springframework.http.HttpHeaders());

        ResponseEntity<List<Map<String, Object>>> response =
                restTemplate.exchange(
                        url,
                        HttpMethod.GET,
                        entity,
                        new ParameterizedTypeReference<List<Map<String, Object>>>() {}
                );

        return response.getBody();
    }

    public List<Map<String, Object>> getFileIODigitalTwin() {
        String filePath = "C:/your/path/digital-twins.json";

        try {
            File file = new File(filePath);

            return objectMapper.readValue(
                    file,
                    new TypeReference<List<Map<String, Object>>>() {}
            );

        } catch (Exception e) {
            throw new RuntimeException("FileIO digital twin 로드 실패: " + filePath, e);
        }
    }

    public List<Map<String, Object>> getHttpDigitalObject(String twinId) {
        String url = "http://{fedtApiIp}:{fedtApiPort}/fedit/v1/digital-twins/"
                + twinId
                + "/digital-objects";

        HttpEntity<String> entity = new HttpEntity<>(new org.springframework.http.HttpHeaders());

        ResponseEntity<List<Map<String, Object>>> response =
                restTemplate.exchange(
                        url,
                        HttpMethod.GET,
                        entity,
                        new ParameterizedTypeReference<List<Map<String, Object>>>() {}
                );

        return response.getBody();
    }

    public List<Map<String, Object>> getFileIODigitalObject(String twinId) {
        return getHttpDigitalObject(twinId);
    }
}
