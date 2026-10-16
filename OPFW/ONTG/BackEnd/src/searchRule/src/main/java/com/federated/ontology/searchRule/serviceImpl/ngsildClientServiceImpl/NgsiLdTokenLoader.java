package com.federated.ontology.searchRule.serviceImpl.ngsildClientServiceImpl;

import lombok.extern.slf4j.Slf4j;
import com.federated.ontology.searchRule.dto.relationshipDto.TokenDicCache;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Slf4j
@Component
public class NgsiLdTokenLoader {

    @Value("${ngsild.pagination.limit:100}")
    private int paginationLimit;

    private final RestTemplate restTemplate;
    private final NgsiLdBrokerClient brokerClient;

    public NgsiLdTokenLoader(RestTemplate restTemplate, NgsiLdBrokerClient brokerClient) {
        this.restTemplate = restTemplate;
        this.brokerClient = brokerClient;
    }

    public Map<String, Set<String>> loadLocalTokens() {
        Map<String, Set<String>> subjectKeyword = fetchSubjectKeywordValues();
        Set<String> names = fetchObjectNameLabels();

        Map<String, Set<String>> tokenDicValues = new HashMap<>();
        tokenDicValues.put("names", names);
        tokenDicValues.put("subjects", subjectKeyword.getOrDefault("subjects", new LinkedHashSet<>()));
        tokenDicValues.put("keywords", subjectKeyword.getOrDefault("keywords", new LinkedHashSet<>()));

        TokenDicCache.updateTags(tokenDicValues);

        return tokenDicValues;
    }

    private Map<String, Set<String>> fetchSubjectKeywordValues() {
        int limit = paginationLimit;
        int offset = 0;

        Set<String> subjects = new LinkedHashSet<>();
        Set<String> keywords = new LinkedHashSet<>();

        while (true) {
            String url = brokerClient.getBrokerUrl() +
                    "?type=DigitalObject&attrs=subjects,keywords" +
                    "&options=keyValues" +
                    "&limit=" + limit +
                    "&offset=" + offset;

            ResponseEntity<List<Map<String, Object>>> response =
                    restTemplate.exchange(
                            url,
                            HttpMethod.GET,
                            null,
                            new ParameterizedTypeReference<List<Map<String, Object>>>() {}
                    );

            List<Map<String, Object>> page = response.getBody();

            if (page == null || page.isEmpty()) {
                break;
            }

            for (Map<String, Object> entity : page) {
                addValue(entity.get("subjects"), subjects);
                addValue(entity.get("keywords"), keywords);
            }

            offset += limit;

            if (page.size() < limit) {
                break;
            }
        }

        Map<String, Set<String>> result = new HashMap<>();
        result.put("subjects", subjects);
        result.put("keywords", keywords);

        return result;
    }

    private Set<String> fetchObjectNameLabels() {
        int limit = paginationLimit;
        int offset = 0;

        Set<String> names = new LinkedHashSet<>();

        while (true) {
            String url = brokerClient.getBrokerUrl() +
                    "?type=DigitalObject" +
                    "&attrs=ngsi-ld:name" +
                    "&options=keyValues" +
                    "&limit=" + limit +
                    "&offset=" + offset;

            ResponseEntity<List<Map<String, Object>>> response =
                    restTemplate.exchange(
                            url,
                            HttpMethod.GET,
                            null,
                            new ParameterizedTypeReference<List<Map<String, Object>>>() {}
                    );

            List<Map<String, Object>> page = response.getBody();

            if (page == null || page.isEmpty()) {
                break;
            }

            for (Map<String, Object> entity : page) {
                Object label = entity.get("ngsi-ld:name");
                if (label instanceof String && !((String) label).isEmpty()) {
                    names.add((String) label);
                }
            }

            offset += limit;

            if (page.size() < limit) {
                break;
            }
        }

        return names;
    }

    private void addValue(Object value, Set<String> target) {
        if (value == null) return;

        if (value instanceof String) {
            target.add((String) value);
        } else if (value instanceof List<?>) {
            for (Object elem : (List<?>) value) {
                if (elem instanceof String) {
                    target.add((String) elem);
                }
            }
        } else {
            log.debug("Unexpected type: {}", value.getClass());
        }
    }
}
