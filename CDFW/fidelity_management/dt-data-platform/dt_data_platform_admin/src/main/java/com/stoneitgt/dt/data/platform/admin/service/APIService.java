package com.stoneitgt.dt.data.platform.admin.service;

import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import javax.annotation.PostConstruct;
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
        META_API_KEY = systemProperties.getDtMetaKey();
        KETI_API_URL = systemProperties.getDtKetiApiUrl();
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
        ResponseEntity<String> response = restTemplate.postForEntity(DT_API_URL + endpoint, request, String.class);
        return response.getBody();
    }

    public ResponseEntity<String> metaApiRequest(String endpoint, Map<String, String> params, HttpMethod method) {
        RestTemplate restTemplate = new RestTemplate();

        // 1. 헤더 설정
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("accept", "*/*");
        headers.set("Authorization", "Bearer " + META_API_KEY);

        // 2. URI 빌드
        UriComponentsBuilder builder = UriComponentsBuilder.fromHttpUrl(META_API_URL + endpoint);
        for (Map.Entry<String, String> entry : params.entrySet()) {
            String key = entry.getKey();
            String value = entry.getValue();
            builder.queryParam(key, value);
        }
        URI uri = builder.build().encode().toUri();

        HttpEntity<?> entity = new HttpEntity<>(headers);

        log.info("Request URI: {}", uri);

        try {
            // 3. API 호출
            ResponseEntity<String> response = restTemplate.exchange(uri, method, entity, String.class);
            log.info("Response Status Code: {}", response.getStatusCode());
            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                return response;
            }
            return null;
        } catch (Exception e) {
            log.error("Meta API 호출 또는 파싱 중 오류 발생: {}", e.getMessage());
            throw e;
        }
    }

    /**
     * Meta API Body 포함 요청 (POST, PUT 용)
     */
    public ResponseEntity<String> metaApiRequestWithBody(String endpoint, Map<String, Object> body, HttpMethod method) {
        RestTemplate restTemplate = new RestTemplate();

        // 1. 헤더 설정
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("accept", "*/*");
        headers.set("Authorization", "Bearer " + META_API_KEY);

        // 2. URI 빌드
        UriComponentsBuilder builder = UriComponentsBuilder.fromHttpUrl(META_API_URL + endpoint);
        URI uri = builder.build().encode().toUri();

        // 3. Body와 Header를 포함한 Entity 생성
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);

        log.info("Request URI: {} | Method: {}", uri, method);

        try {
            // 4. API 호출
            ResponseEntity<String> response = restTemplate.exchange(uri, method, entity, String.class);
            log.info("Response Status Code: {}", response.getStatusCode());

            if (response.getStatusCode() == HttpStatus.OK || response.getStatusCode() == HttpStatus.CREATED) {
                return response;
            }
            return null;
        } catch (HttpStatusCodeException e) {
            log.error("Meta API 에러 응답: {}", e.getResponseBodyAsString());
            log.error("상태 코드: {}, 메시지: {}", e.getStatusCode(), e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("Meta API 호출 오류 ({}): {}", method, e.getMessage());
            throw e;
        }
    }

    public ResponseEntity<String> syncEngineApiRequest(String endpoint, Map<String, Object> params, HttpMethod method) {
        log.info("syncEngineApiRequest -> endpoint: {}, method: {}", endpoint, method);
        RestTemplate restTemplate = new RestTemplate();

        // 1. 헤더 설정
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("accept", "*/*");
        headers.set("Authorization", "Bearer " + META_API_KEY);

        UriComponentsBuilder builder = UriComponentsBuilder.fromHttpUrl(KETI_API_URL + endpoint);
        HttpEntity<?> entity;
        URI uri;

        if (method == HttpMethod.POST || method == HttpMethod.PUT) {
            // [POST/PUT] 파라미터를 Body에 담음
            uri = builder.build().encode().toUri();
            entity = new HttpEntity<>(params, headers); // Map이 자동으로 JSON으로 직렬화됨
        } else {
            // [GET/DELETE 등] 파라미터를 URL 쿼리 스트링으로 빌드
            for (Map.Entry<String, Object> entry : params.entrySet()) {
                builder.queryParam(entry.getKey(), entry.getValue());
            }
            uri = builder.build().encode().toUri();
            entity = new HttpEntity<>(headers);
        }

        log.info("Request URI: {} | Method: {}", uri, method);

        try {
            // 3. API 호출
            ResponseEntity<String> response = restTemplate.exchange(uri, method, entity, String.class);
            log.info("Response Status Code: {}", response.getStatusCode());

            if ((response.getStatusCode() == HttpStatus.OK || response.getStatusCode() == HttpStatus.CREATED)) {
                return response;
            }
            return null;
        } catch (HttpStatusCodeException e) {
            // 400, 500 등 서버가 응답한 상세 JSON 메시지를 출력
            log.error("Sync Engine API 에러 응답: {}", e.getResponseBodyAsString());
            log.error("상태 코드: {}, 메시지: {}", e.getStatusCode(), e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("Sync Engine API 호출 오류 ({}): {}", method, e.getMessage());
            throw e;
        }
    }

    public ResponseEntity<String> bulkSyncEngineApiRequest(RestTemplate bulkRestTemplate, String endpoint, Map<String, Object> params, HttpMethod method) {
        log.info("syncEngineApiRequest -> endpoint: {}, method: {}", endpoint, method);

        // 1. 헤더 설정
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("accept", "*/*");
        headers.set("Authorization", "Bearer " + META_API_KEY);

        UriComponentsBuilder builder = UriComponentsBuilder.fromHttpUrl(KETI_API_URL + endpoint);
        HttpEntity<?> entity;
        URI uri;

        if (method == HttpMethod.POST || method == HttpMethod.PUT) {
            // [POST/PUT] 파라미터를 Body에 담음
            uri = builder.build().encode().toUri();
            entity = new HttpEntity<>(params, headers); // Map이 자동으로 JSON으로 직렬화됨
        } else {
            // [GET/DELETE 등] 파라미터를 URL 쿼리 스트링으로 빌드
            for (Map.Entry<String, Object> entry : params.entrySet()) {
                builder.queryParam(entry.getKey(), entry.getValue());
            }
            uri = builder.build().encode().toUri();
            entity = new HttpEntity<>(headers);
        }

        log.info("Request URI: {} | Method: {}", uri, method);

        try {
            // 3. API 호출
            ResponseEntity<String> response = bulkRestTemplate.exchange(uri, method, entity, String.class);
            log.info("Response Status Code: {}", response.getStatusCode());

            if ((response.getStatusCode() == HttpStatus.OK || response.getStatusCode() == HttpStatus.CREATED)) {
                return response;
            }
            return null;
        } catch (HttpStatusCodeException e) {
            // 400, 500 등 서버가 응답한 상세 JSON 메시지를 출력
            log.error("Sync Engine API 에러 응답: {}", e.getResponseBodyAsString());
            log.error("상태 코드: {}, 메시지: {}", e.getStatusCode(), e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("Sync Engine API 호출 오류 ({}): {}", method, e.getMessage());
            throw e;
        }
    }
}