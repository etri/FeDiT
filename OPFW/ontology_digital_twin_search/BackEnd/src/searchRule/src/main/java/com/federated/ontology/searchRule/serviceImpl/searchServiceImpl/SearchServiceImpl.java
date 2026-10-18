package com.federated.ontology.searchRule.serviceImpl.searchServiceImpl;

import com.federated.ontology.searchRule.service.searchService.SearchService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;
import java.util.Map;

@Service
public class SearchServiceImpl implements SearchService {

    @Value("${stellio.broker.base-url}")
    private String brokerBaseUrl;

    private final RestTemplate restTemplate;
    private final RecommendationService recommendationService;
    private final SearchGraphService searchGraphService;

    public SearchServiceImpl(RestTemplate restTemplate,
                             RecommendationService recommendationService,
                             SearchGraphService searchGraphService) {
        this.restTemplate = restTemplate;
        this.recommendationService = recommendationService;
        this.searchGraphService = searchGraphService;
    }

    @Override
    public ResponseEntity<String> getQueryResults(String type, String q, String options) {
        String url = brokerBaseUrl + "/entities";

        UriComponentsBuilder builder = UriComponentsBuilder.fromUriString(url)
                .queryParam("type", type);

        if (q != null) builder.queryParam("q", q);
        if (options != null) builder.queryParam("options", options);

        URI requestUri = builder.build().encode().toUri();

        return restTemplate.getForEntity(requestUri, String.class);
    }

    @Override
    public Map<String, Object> getSearchCombination(String searchQuery) {
        return recommendationService.getSearchCombination(searchQuery);
    }

    @Override
    public Map<String, Object> getSearchGraph(String searchQuery) {
        return searchGraphService.getSearchGraph(searchQuery);
    }
}
