package com.federated.ontology.searchRule.serviceImpl.searchServiceImpl;

import com.federated.ontology.searchRule.dto.relationshipDto.TokenDicCache;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.client.ExpectedCount;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

class SearchServiceImplTest {

    private static final String BROKER_BASE_URL = "http://{stellioIp}:{stellioPort}/ngsi-ld/v1";

    private RestTemplate restTemplate;
    private MockRestServiceServer server;
    private SearchServiceImpl searchService;

    @BeforeEach
    void setUp() {
        restTemplate = new RestTemplate();
        server = MockRestServiceServer.createServer(restTemplate);

        searchService = new SearchServiceImpl(restTemplate, null, null);
        ReflectionTestUtils.setField(searchService, "brokerBaseUrl", BROKER_BASE_URL);

        TokenDicCache.updateTags(Map.of());
    }

    @AfterEach
    void tearDown() {
        server.verify();
        TokenDicCache.updateTags(Map.of());
    }

    @Test
    void getQueryResultsBuildsUriWithOptionalParameters() {
        String expectedUri = UriComponentsBuilder.fromUriString(BROKER_BASE_URL + "/entities")
                .queryParam("type", "SmartBuilding")
                .queryParam("q", "address==\"Busan\"")
                .queryParam("options", "keyValues")
                .build()
                .encode()
                .toUriString();

        server.expect(ExpectedCount.once(), requestTo(expectedUri))
                .andExpect(method(HttpMethod.GET))
                .andRespond(withSuccess("{\"status\":\"ok\"}", MediaType.APPLICATION_JSON));

        ResponseEntity<String> response = searchService.getQueryResults("SmartBuilding", "address==\"Busan\"", "keyValues");

        assertThat(response.getBody()).isEqualTo("{\"status\":\"ok\"}");
    }
}
