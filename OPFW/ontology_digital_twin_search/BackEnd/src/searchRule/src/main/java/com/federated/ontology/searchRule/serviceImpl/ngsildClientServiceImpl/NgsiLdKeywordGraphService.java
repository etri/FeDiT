package com.federated.ontology.searchRule.serviceImpl.ngsildClientServiceImpl;

import com.federated.ontology.searchRule.component.KeywordGraph;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;
import java.util.List;
import java.util.Map;

@Component
public class NgsiLdKeywordGraphService {

    @Value("${ngsild.pagination.limit:100}")
    private int paginationLimit;

    private final RestTemplate restTemplate;
    private final KeywordGraph keywordGraph;
    private final NgsiLdBrokerClient brokerClient;

    public NgsiLdKeywordGraphService(RestTemplate restTemplate,
                                     KeywordGraph keywordGraph,
                                     NgsiLdBrokerClient brokerClient) {
        this.restTemplate = restTemplate;
        this.keywordGraph = keywordGraph;
        this.brokerClient = brokerClient;
    }

    @SuppressWarnings("unchecked")
    public void buildKeywordGraphFromBroker() {
        keywordGraph.clear();

        int limit = paginationLimit;
        int offset = 0;

        while (true) {
            URI uri = UriComponentsBuilder.fromUriString(brokerClient.getBrokerUrl())
                    .queryParam("type", "DigitalObject")
                    .queryParam("limit", limit)
                    .queryParam("offset", offset)
                    .build()
                    .encode()
                    .toUri();

            ResponseEntity<List<Map<String, Object>>> response =
                    restTemplate.exchange(
                            uri,
                            HttpMethod.GET,
                            null,
                            new ParameterizedTypeReference<List<Map<String, Object>>>() {}
                    );

            List<Map<String, Object>> page = response.getBody();
            if (page == null || page.isEmpty()) {
                break;
            }

            for (Map<String, Object> entity : page) {
                keywordGraph.addObjectEntity(entity);
            }

            offset += limit;
            if (page.size() < limit) {
                break;
            }
        }
    }

    public void markInitialized() {
        keywordGraph.markInitialized();
    }
}
