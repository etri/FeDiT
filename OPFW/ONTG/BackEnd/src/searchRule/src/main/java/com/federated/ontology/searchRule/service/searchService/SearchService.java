package com.federated.ontology.searchRule.service.searchService;

import org.springframework.http.ResponseEntity;

import java.util.Map;

public interface SearchService {
    ResponseEntity<String> getQueryResults(String type, String q, String options);
    Map<String,Object> getSearchCombination(String entityId);
    Map<String,Object> getSearchGraph(String entityId);
}
