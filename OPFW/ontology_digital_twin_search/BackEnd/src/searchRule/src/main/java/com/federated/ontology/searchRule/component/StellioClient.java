package com.federated.ontology.searchRule.component;

import lombok.extern.slf4j.Slf4j;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Component
public class StellioClient {

    @Value("${stellio.broker.base-url}")
    private String brokerBaseUrl;

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    public StellioClient(RestTemplate restTemplate, ObjectMapper objectMapper) {
        this.restTemplate = restTemplate;
        this.objectMapper = objectMapper;
    }

    public void patchRelationshipToTwin(String twinUrn, String objectUrn, String category) {
        try {
            String url = brokerBaseUrl + "/entities/" + twinUrn + "/attrs";

            Map<String, Object> payload = new HashMap<>();
            Map<String, Object> relationship = new HashMap<>();
            Map<String, Object> properties = new HashMap<>();
            Map<String, Object> categoryProp = new HashMap<>();

            categoryProp.put("type", "Property");
            categoryProp.put("value", category);
            properties.put("category", categoryProp);

            relationship.put("type", "Relationship");
            relationship.put("object", objectUrn);
            relationship.put("properties", properties);

            payload.put("hasDigitalObject", relationship);
            payload.put("@context", Arrays.asList(
                    "https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld",
                    "https://example.org/ontology/digitaltwin-context.jsonld"
            ));

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.valueOf("application/ld+json"));

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(payload, headers);

            ResponseEntity<String> response = restTemplate.exchange(
                    url, HttpMethod.PATCH, entity, String.class);

            log.info("Stellio PATCH Response: {}", response.getStatusCode());

        } catch (Exception e) {
            log.error("Failed to register relationship to Stellio", e);
            throw new RuntimeException("Failed to register relationship to Stellio", e);
        }
    }

    public List<Map<String, Object>> queryObjectsByTwin(String twinId) {
        String url = brokerBaseUrl + "/entities"
                + "?type=DigitalObject"
                + "&q=belongsToTwin==urn:ngsi-ld:DigitalTwin:" + twinId;

        ResponseEntity<List> response = restTemplate.getForEntity(url, List.class);
        return response.getBody();
    }

}
