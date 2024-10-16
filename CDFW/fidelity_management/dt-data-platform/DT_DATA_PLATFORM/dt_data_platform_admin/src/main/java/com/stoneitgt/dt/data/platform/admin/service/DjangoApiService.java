package com.stoneitgt.dt.data.platform.admin.service;

import java.util.HashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import com.stoneitgt.common.GlobalConstant.FILE_REF_TYPE;
import com.stoneitgt.dt.data.platform.properties.BaseSystemProperties;
import com.stoneitgt.dt.data.platform.util.file.FileUtil;

@Service
public class DjangoApiService {

    @Autowired
    private BaseSystemProperties systemproperties;

    public String requestDjangoApi(String url, Map<String, Object> params, int modelSeq) {
        Map<String, Object> result = new HashMap<String, Object>();

        RestTemplate restTemplate = new RestTemplate();

        String contentType = "application/json";
        String authKey = "Token " + systemproperties.getDtApiKey();

        HttpHeaders headers = new HttpHeaders();
        headers.add("Content-Type", contentType);
        headers.add("Authorization", authKey);

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(params, headers);

        ResponseEntity<String> response = restTemplate.postForEntity(url, request, String.class);
        String responseBody = response.getBody();
        result.put("responseBody", responseBody);

        return responseBody;
    }
}
