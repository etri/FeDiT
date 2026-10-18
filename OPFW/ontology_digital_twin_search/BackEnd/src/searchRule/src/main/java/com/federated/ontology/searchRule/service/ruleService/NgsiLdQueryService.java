package com.federated.ontology.searchRule.service.ruleService;

public interface NgsiLdQueryService {
    String findBuildingsWithSensor(String city, String type, String status);
    String query(String param);
}
