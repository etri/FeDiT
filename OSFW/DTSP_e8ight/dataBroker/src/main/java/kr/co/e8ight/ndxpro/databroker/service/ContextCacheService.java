package kr.co.e8ight.ndxpro.databroker.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import kr.co.e8ight.ndxpro.common.exception.error.ErrorCode;
import kr.co.e8ight.ndxpro.databroker.exception.DataBrokerException;
import kr.co.e8ight.ndxpro.databroker.util.ValidateUtil;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.net.URI;
import java.util.HashMap;
import java.util.Map;

import static kr.co.e8ight.ndxpro.databroker.util.CoreContextDataModelCode.CONTEXT;

@Slf4j
@Component
public class ContextCacheService {

    private final RestTemplate restTemplate;

    private final ObjectMapper objectMapper;

    public ContextCacheService(RestTemplate restTemplate, ObjectMapper objectMapper) {
        this.restTemplate = restTemplate;
        this.objectMapper = objectMapper;
    }

    @Cacheable(key = "#contextURI", value = "context")
    public Map<String, String> getDataModelsInContext(String contextURI) {
        String responsePayload = requestHTTPContext(contextURI);
        if(ValidateUtil.isEmptyData(responsePayload))
            throw new DataBrokerException(ErrorCode.INVALID_REQUEST, "Retrieve @context error. contextURI=" + contextURI);

        Map<String, Object> contextMap;
        try {
            contextMap = objectMapper.readValue(responsePayload, Map.class);
        } catch (JsonProcessingException e) {
            throw new DataBrokerException(ErrorCode.INVALID_REQUEST, "Retrieve @context error. contextURI=" + contextURI);
        }
        Map<String, String> dataModels = new HashMap<>();
        Map<String, Object> context = (Map<String, Object>) contextMap.get(CONTEXT.getCode());

        Map<String, String> fullURLValue = new HashMap<>();
        for(Map.Entry<String, Object> entry : context.entrySet()) {
            Object value = entry.getValue();
            if(value instanceof String) {
                String valueString = String.valueOf(value);
//                if(valueString.contains("http://") || valueString.contains("https://")) {
//                    fullURLValue.put(entry.getKey(), valueString);
//                } else {
                    dataModels.put(entry.getKey(), (String) value);
//                }
            } else if(value instanceof Map) {
                dataModels.put(entry.getKey(), ((Map<String, String>) value).get("@id"));
            }
        };

        // dataModel shortest url 에서 full url 로 변환
//        for(Map.Entry<String, String> entry : dataModels.entrySet()) {
//            String value = entry.getValue();
//            for(Map.Entry<String, String> fullURL : dataModels.entrySet()) {
//                String key = fullURL.getKey();
//                String url = fullURL.getValue();
//                if(value.split(":")[0].equals(key))
//                    value.replaceFirst(key, url);
//            }
//            entry.setValue(value);
//        }
        return dataModels;
    }

    public String requestHTTPContext(String contextURI) {
        MultiValueMap<String, String> headerMap = new LinkedMultiValueMap<>();
        headerMap.set(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE);
        headerMap.set(HttpHeaders.ACCEPT, MediaType.ALL_VALUE);

        // contextURI requestEntity
        RequestEntity<Void> requestEntity = new RequestEntity<>(headerMap, HttpMethod.GET, URI.create(contextURI));

        ResponseEntity<String> responseEntity;
        try {
            // contextURI 에 요청 후 String 타입으로 response 반환
            responseEntity = restTemplate.exchange(requestEntity, String.class);
        } catch (RestClientException e) {
            throw new DataBrokerException(ErrorCode.INVALID_REQUEST, "Retrieve @context error. "
                    + "message=" + e.getMessage() + ", contextURI=" + contextURI);
        }

        // contextURI 요청에 성공했을 경우, JsonldContextBaseVO 생성 및 return
        if(responseEntity.getStatusCode() == HttpStatus.OK) {

            if (responseEntity.getBody() == null || responseEntity.getBody().isEmpty())
                throw new DataBrokerException(ErrorCode.INVALID_REQUEST, "Retrieve @context error. body is empty. contextURI=" + contextURI);
            return responseEntity.getBody();
        }
        return null;
    }
}
