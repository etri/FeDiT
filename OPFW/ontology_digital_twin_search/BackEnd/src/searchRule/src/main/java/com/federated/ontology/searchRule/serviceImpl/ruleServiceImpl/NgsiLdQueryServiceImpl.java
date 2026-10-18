package com.federated.ontology.searchRule.serviceImpl.ruleServiceImpl;

import com.federated.ontology.searchRule.service.ruleService.NgsiLdQueryService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
public class NgsiLdQueryServiceImpl implements NgsiLdQueryService {

    private final RestTemplate restTemplate;

    @Value("${stellio.broker.base-url}")
    private String brokerBaseUrl;

    public NgsiLdQueryServiceImpl(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    private String getEntitiesUrl() { return brokerBaseUrl + "/entities"; }

    @Override
    public String findBuildingsWithSensor(String city, String type, String status) {
        String url = getEntitiesUrl()
                + "?type=SmartBuilding"
                + "&q=address==\"" + city + "\";hasSensor.sensorType==\"" + type + "\";hasSensor.status==\"" + status + "\"";

        HttpHeaders headers = new HttpHeaders();
        headers.set("Accept", "application/ld+json");

        HttpEntity<Void> entity = new HttpEntity<>(headers);
        ResponseEntity<String> response =
                restTemplate.exchange(url, HttpMethod.GET, entity, String.class);

        return response.getBody();
    }

    @Override
    public String query(String param) {
        String url = getEntitiesUrl() + param;
        HttpHeaders headers = new HttpHeaders();
        headers.set("Accept", "application/ld+json");

        HttpEntity<Void> entity = new HttpEntity<>(headers);
        ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.GET, entity, String.class);
        return response.getBody();
    }

}
