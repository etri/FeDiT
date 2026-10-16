package com.federated.ontology.searchRule.serviceImpl.searchServiceImpl;

import com.federated.ontology.searchRule.dto.searchDTO.MatchedEntitiesDTO;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;
import org.springframework.web.util.UriUtils;

import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class EntityMatchingService {

    @Value("${stellio.broker.base-url}")
    private String brokerBaseUrl;

    @Value("${ngsild.pagination.limit:100}")
    private int paginationLimit;

    private final RestTemplate restTemplate;
    private final TokenParsingService tokenParsingService;

    public EntityMatchingService(RestTemplate restTemplate, TokenParsingService tokenParsingService) {
        this.restTemplate = restTemplate;
        this.tokenParsingService = tokenParsingService;
    }

    private String getBrokerEntitiesUrl() { return brokerBaseUrl + "/entities"; }

    public MatchedEntitiesDTO fetchMatchedEntities(String type, String params, MatchedEntitiesDTO matchedEntities) {
        int limit = paginationLimit;
        int offset = 0;

        while (true) {
            String queryFilter = type + "==\"" + params + "\"";
            URI matchedEntitiesUri = UriComponentsBuilder.fromUriString(getBrokerEntitiesUrl())
                    .queryParam("q", queryFilter)
                    .queryParam("limit", limit)
                    .queryParam("offset", offset)
                    .build()
                    .encode()
                    .toUri();

            ResponseEntity<List<Map<String, Object>>> response =
                    restTemplate.exchange(
                            matchedEntitiesUri,
                            HttpMethod.GET,
                            null,
                            new ParameterizedTypeReference<List<Map<String, Object>>>() {}
                    );

            List<Map<String, Object>> page = response.getBody();

            if (page == null || page.isEmpty()) {
                break;
            }

            for (Map<String, Object> entity : page) {
                matchedEntities.setMatchedEntities(entity);
            }

            offset += limit;

            if (page.size() < limit) {
                break;
            }
        }

        return matchedEntities;
    }

    public MatchedEntitiesDTO fetchDigitalObjectIdsByNames(Set<String> names, MatchedEntitiesDTO matchedEntities) {
        if (names == null || names.isEmpty()) {
            return matchedEntities;
        }

        int limit = paginationLimit;
        int offset = 0;

        String qValue = names.stream()
                .filter(n -> n != null && !n.isEmpty())
                .map(n -> "\"" + n + "\"")
                .collect(Collectors.joining(","));
        String q = "ngsi-ld:name==" + qValue;

        while (true) {
            String url = getBrokerEntitiesUrl() +
                    "?type=DigitalObject" +
                    "&q=" + UriUtils.encodeQueryParam(q, StandardCharsets.UTF_8) +
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
                matchedEntities.setMatchedEntities(entity);
            }

            offset += limit;

            if (page.size() < limit) {
                break;
            }
        }

        return matchedEntities;
    }

    @SuppressWarnings("unchecked")
    public Map<String, Object> fetchEntityById(String entityId) {
        if (entityId == null || entityId.isEmpty()) {
            return null;
        }

        URI uri = UriComponentsBuilder.fromUriString(getBrokerEntitiesUrl() + "/" + entityId)
                .build()
                .encode()
                .toUri();

        ResponseEntity<Map> response = restTemplate.getForEntity(uri, Map.class);
        if (!response.getStatusCode().is2xxSuccessful()) {
            return null;
        }

        Object body = response.getBody();
        if (body instanceof Map<?, ?> map) {
            return (Map<String, Object>) map;
        }

        return null;
    }

    public void fetchMatchedEntitiesByNames(Set<String> matchedNameTokens, MatchedEntitiesDTO out) {
        fetchDigitalObjectIdsByNames(matchedNameTokens, out);
    }

    public void fetchMatchedEntitiesBySubjects(Set<String> matchedSubjectTokens, MatchedEntitiesDTO out) {
        String subjects = String.join("\",\"", matchedSubjectTokens);
        fetchMatchedEntities("subjects", subjects, out);
    }

    public void fetchMatchedEntitiesByKeywords(Set<String> matchedKeywordTokens, MatchedEntitiesDTO out) {
        String keywords = String.join("\",\"", matchedKeywordTokens);
        fetchMatchedEntities("keywords", keywords, out);
    }

    public List<Map<String, Object>> fetchTwinEntitiesForObjects(List<Map<String, Object>> objectEntities) {
        List<Map<String, Object>> twins = new ArrayList<>();
        Set<String> seenTwinIds = new HashSet<>();

        if (objectEntities == null) {
            return twins;
        }

        for (Map<String, Object> objectEntity : objectEntities) {
            String twinId = extractRelationshipObjectId(objectEntity, "isDigitalObjectOf");
            if (twinId == null || seenTwinIds.contains(twinId)) {
                continue;
            }

            Map<String, Object> twin = fetchEntityById(twinId);
            if (twin != null) {
                twins.add(twin);
                seenTwinIds.add(twinId);
            }
        }

        return twins;
    }

    @SuppressWarnings("unchecked")
    public void attachDetectedNames(Map<String, Object> entity, Set<String> matchedNameTokens) {
        if (matchedNameTokens == null || matchedNameTokens.isEmpty()) {
            return;
        }

        Object nameObj = entity.get("ngsi-ld:name");
        String entityName = null;

        if (nameObj instanceof Map) {
            Object v = ((Map<String, Object>) nameObj).get("value");
            if (v instanceof String) {
                entityName = (String) v;
            }
        } else if (nameObj instanceof String) {
            entityName = (String) nameObj;
        } else {
            return;
        }

        Set<String> detectedNames = new LinkedHashSet<>();
        for (String token : matchedNameTokens) {
            if (entityName.contains(token)) {
                detectedNames.add(token);
            }
        }

        if (!detectedNames.isEmpty()) {
            entity.put("detectedNames", detectedNames);
        }
    }

    public void attachDetectedSubKeys(
            Map<String, Object> entity,
            Set<String> matchedSubjectTokens,
            Set<String> matchedKeywordTokens
    ) {
        Set<String> entitySubjects = tokenParsingService.extractStringValues(entity.get("subjects"));
        Set<String> entityKeywords = tokenParsingService.extractStringValues(entity.get("keywords"));

        Set<String> detectedSubjects = new LinkedHashSet<>();
        for (String s : entitySubjects) {
            if (matchedSubjectTokens.contains(s)) {
                detectedSubjects.add(s);
            }
        }

        Set<String> detectedKeywords = new LinkedHashSet<>();
        for (String k : entityKeywords) {
            if (matchedKeywordTokens.contains(k)) {
                detectedKeywords.add(k);
            }
        }

        if (!detectedSubjects.isEmpty()) {
            entity.put("detectedSubjects", detectedSubjects);
        }
        if (!detectedKeywords.isEmpty()) {
            entity.put("detectedKeywords", detectedKeywords);
        }
    }

    public void attachDetectedForList(
            List<Map<String, Object>> entities,
            Set<String> matchedNameTokens,
            Set<String> matchedSubjectTokens,
            Set<String> matchedKeywordTokens
    ) {
        if (entities == null) return;

        for (Map<String, Object> entity : entities) {
            attachDetectedNames(entity, matchedNameTokens);
            attachDetectedSubKeys(entity, matchedSubjectTokens, matchedKeywordTokens);
        }
    }

    @SuppressWarnings("unchecked")
    public String extractRelationshipObjectId(Map<String, Object> entity, String relName) {
        Object rel = entity.get(relName);
        if (rel == null) {
            return null;
        }

        if (rel instanceof Map<?, ?> map) {
            Object obj = map.get("object");
            return obj != null ? obj.toString() : null;
        }

        if (rel instanceof Collection<?> col) {
            for (Object item : col) {
                if (item instanceof Map<?, ?> map) {
                    Object obj = map.get("object");
                    if (obj != null) {
                        return obj.toString();
                    }
                }
            }
        }

        return null;
    }

    @SuppressWarnings("unchecked")
    public int getCollectionSize(Object obj) {
        if (obj == null) return 0;
        if (obj instanceof Collection<?>) return ((Collection<?>) obj).size();
        return 1;
    }
}
