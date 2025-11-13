package com.stoneitgt.dt.data.platform.admin.service;

import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import javax.annotation.PostConstruct;
import java.io.UnsupportedEncodingException;
import java.net.URI;
import java.util.Map;

@Service
@Data
@Slf4j
@EqualsAndHashCode(callSuper = false) // 상위 클래스의 equals/hashCode 제외 (신중하게 사용)
public class APIService extends BaseService {
    private String DT_API_URL;
    private String DT_API_KEY;
    private String META_API_URL;
    private String META_API_KEY;
    private String KETI_API_URL;
    private String KETI_API_KEY;

    @PostConstruct
    public void init() {
        DT_API_URL = systemProperties.getDtApiUrl();
        DT_API_KEY = systemProperties.getDtApiKey();
        META_API_URL = systemProperties.getDtMetaApiUrl();
        META_API_KEY = systemProperties.getDtN2mKey();
        KETI_API_URL = systemProperties.getDtKetiApiUrl();
        KETI_API_KEY = systemProperties.getDtN2mKey();
    }

    /**
     * Python 관련 API
     */
    public String requestPythonApi(String endpoint, Map<String, Object> params) {
        RestTemplate restTemplate = new RestTemplate();
        HttpHeaders headers = new HttpHeaders();
        headers.add("Content-Type", "application/json");
        headers.add("Authorization", "Token " + DT_API_KEY);
        HttpEntity<Map<String, Object>> request = new HttpEntity<>(params, headers);
        log.info("url -> {}", DT_API_URL + endpoint);
        log.info("parameters -> {}", params);
        ResponseEntity<String> response = restTemplate.postForEntity(DT_API_URL + endpoint, request, String.class);
        return response.getBody();
    }

    /**
     * 디지털 트윈 메타 데이터 관련 API
     */
    public String requestMetaDataApi(String endpoint, Map<String, Object> params) throws UnsupportedEncodingException {
        RestTemplate restTemplate = new RestTemplate();
        HttpHeaders headers = new HttpHeaders();
        headers.add("Content-Type", "application/json");
        headers.add("Authorization", "Bearer " + META_API_KEY);
        headers.add("accept", "*/*");

        UriComponentsBuilder builder = UriComponentsBuilder.fromHttpUrl(META_API_URL + endpoint);
        for (Map.Entry<String, Object> entry : params.entrySet()) {
            String key = entry.getKey();
            Object value = entry.getValue();
            builder.queryParam(key, value);
        }
        URI uri = builder.build().expand(params).encode().toUri();
        HttpEntity<?> entity = new HttpEntity<>(headers);
        log.info("uri -> {}", META_API_URL + endpoint);
        ResponseEntity<String> response = restTemplate.exchange(uri, HttpMethod.GET, entity, String.class);
        return response.getBody();
    }

    /**
     * 디지털 트윈 동기화 엔진 데이터 관련 API
     */
    public String requestDataApi(String endpoint, Map<String, Object> params) {
        RestTemplate restTemplate = new RestTemplate();
        HttpHeaders headers = new HttpHeaders();
        headers.add("Content-Type", "application/json");
        headers.add("Authorization", "Bearer " + KETI_API_KEY);

        UriComponentsBuilder builder = UriComponentsBuilder.fromHttpUrl(META_API_URL + endpoint);
        for (Map.Entry<String, Object> entry : params.entrySet()) {
            String key = entry.getKey();
            Object value = entry.getValue();
            builder.queryParam(key, value);
        }
        HttpEntity<?> entity = new HttpEntity<>(headers);
        log.info("url -> {}", KETI_API_URL + endpoint);
        ResponseEntity<String> response = null;
        response = restTemplate.exchange(KETI_API_URL + endpoint, HttpMethod.GET, entity, String.class);
        return response != null ? response.getBody() : null;
    }

    public String requestDataPostApi(String endpoint, String body, HttpMethod httpMethod) {
        RestTemplate restTemplate = new RestTemplate();
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.add("Authorization", "Bearer " + KETI_API_KEY);
        HttpEntity<?> entity = body != null ? new HttpEntity<>(body, headers) : new HttpEntity<>(headers);
        log.info("url -> {}", KETI_API_URL + endpoint);
        ResponseEntity<String> response = null;
        response = restTemplate.exchange(KETI_API_URL + endpoint, httpMethod, entity, String.class);
        return response != null ? response.getBody() : null;
    }
}