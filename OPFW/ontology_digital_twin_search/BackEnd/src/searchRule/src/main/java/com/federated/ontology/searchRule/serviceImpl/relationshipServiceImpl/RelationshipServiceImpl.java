package com.federated.ontology.searchRule.serviceImpl.relationshipServiceImpl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.federated.ontology.searchRule.component.StellioClient;
import com.federated.ontology.searchRule.service.relationshipService.RelationshipService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
public class RelationshipServiceImpl implements RelationshipService {

    @Value("${stellio.broker.base-url}")
    private String brokerBaseUrl;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;
    private final StellioClient stellioClient;

    public RelationshipServiceImpl(RestTemplate restTemplate, ObjectMapper objectMapper, StellioClient stellioClient) {
        this.restTemplate = restTemplate;
        this.objectMapper = objectMapper;
        this.stellioClient = stellioClient;
    }

    @Override
    public void registerRelationship(String twinId, String objectId, String category) {
        String twinUrn = "urn:ngsi-ld:DigitalTwin:" + twinId;
        String objectUrn = "urn:ngsi-ld:DigitalObject:" + objectId;

        stellioClient.patchRelationshipToTwin(twinUrn, objectUrn, category);
    }

}
