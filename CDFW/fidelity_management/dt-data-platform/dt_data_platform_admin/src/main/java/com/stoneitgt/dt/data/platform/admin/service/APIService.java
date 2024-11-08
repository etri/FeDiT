package com.stoneitgt.dt.data.platform.admin.service;

import com.stoneitgt.dt.data.platform.admin.properties.SystemProperties;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
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
public class APIService {

    @Autowired
    private SystemProperties systemProperties;

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
        log.info("uri -> {}", uri);
        ResponseEntity<String> response = restTemplate.exchange(uri, HttpMethod.GET, entity, String.class);
        return response.getBody();
    }

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
        URI uri = builder.build().expand(params).encode().toUri();
        HttpEntity<?> entity = new HttpEntity<>(headers);
        log.info("uri -> {}", uri);
        ResponseEntity<String> response = restTemplate.exchange(KETI_API_URL + endpoint, HttpMethod.GET, entity, String.class);
        return response.getBody();
    }
}
