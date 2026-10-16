package com.federated.ontology.searchRule.serviceImpl.ngsildClientServiceImpl;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;

import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Component
public class NgsiLdOntologyService {

    @Value("${ngsild.pagination.limit:100}")
    private int paginationLimit;

    private final RestTemplate restTemplate;
    private final NgsiLdBrokerClient brokerClient;
    private final NgsiLdEntityBuilder entityBuilder;

    public NgsiLdOntologyService(RestTemplate restTemplate,
                                 NgsiLdBrokerClient brokerClient,
                                 NgsiLdEntityBuilder entityBuilder) {
        this.restTemplate = restTemplate;
        this.brokerClient = brokerClient;
        this.entityBuilder = entityBuilder;
    }

    public void createOntologyTerms(Set<String> values, String termType, String errorPrefix) {
        if (values == null) {
            return;
        }

        for (String value : values) {
            if (value == null || value.isBlank()) {
                continue;
            }

            Map<String, Object> termEntity = entityBuilder.buildOntologyTermEntity(termType, value);
            brokerClient.upsertEntity(termEntity, errorPrefix + value);
        }
    }

    public void patchDigitalObjectsWithTerms() {
        int limit = paginationLimit;
        int offset = 0;

        while (true) {
            String url = brokerClient.getBrokerUrl()
                    + "?attrs=subjects,keywords"
                    + "&options=keyValues"
                    + "&limit=" + limit
                    + "&offset=" + offset;

            ResponseEntity<List<Map<String, Object>>> response =
                    restTemplate.exchange(
                            url,
                            HttpMethod.GET,
                            null,
                            new ParameterizedTypeReference<List<Map<String, Object>>>() {}
                    );

            List<Map<String, Object>> page = response.getBody();
            if (page == null || page.isEmpty()) break;

            for (Map<String, Object> entity : page) {
                Object idObj = entity.get("id");
                if (idObj == null) continue;

                String entityId = idObj.toString();

                Set<String> subjectTermIds = new LinkedHashSet<>();
                Set<String> keywordTermIds = new LinkedHashSet<>();

                entityBuilder.extractOntologyTermIds(entity.get("subjects"), "SubjectTerm", subjectTermIds);
                entityBuilder.extractOntologyTermIds(entity.get("keywords"), "KeywordTerm", keywordTermIds);

                if (subjectTermIds.isEmpty() && keywordTermIds.isEmpty()) {
                    continue;
                }

                Map<String, Object> attrs = new LinkedHashMap<>();
                entityBuilder.addMultiObjectRelationship(attrs, "hasSubjectTerm", subjectTermIds);
                entityBuilder.addMultiObjectRelationship(attrs, "hasKeywordTerm", keywordTermIds);
                attrs.put("@context", entityBuilder.coreContext());

                brokerClient.patchEntityAttrs(entityId, attrs);
            }

            if (page.size() < limit) break;
            offset += limit;
        }
    }

    public void createDuplicateObjectNames() {
        final int limit = paginationLimit;
        int offset = 0;

        Map<String, List<String>> objectsByName = new LinkedHashMap<>();

        while (true) {
            String url = brokerClient.getBrokerUrl()
                    + "?type=DigitalObject"
                    + "&attrs=ngsi-ld:name"
                    + "&options=keyValues"
                    + "&limit=" + limit
                    + "&offset=" + offset;

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
                Object idObj = entity.get("id");
                if (idObj == null) {
                    continue;
                }
                String entityId = String.valueOf(idObj);

                Object rawName = entity.get("ngsi-ld:name");
                if (rawName == null) {
                    rawName = entity.get("name");
                }

                if (!(rawName instanceof String)) {
                    continue;
                }

                String name = ((String) rawName).trim();
                if (name.isEmpty()) {
                    continue;
                }

                List<String> list = objectsByName.get(name);
                if (list == null) {
                    list = new ArrayList<>();
                    objectsByName.put(name, list);
                }
                list.add(entityId);
            }

            if (page.size() < limit) {
                break;
            }
            offset += limit;
        }

        if (objectsByName.isEmpty()) {
            return;
        }

        for (Map.Entry<String, List<String>> entry : objectsByName.entrySet()) {
            String name = entry.getKey();
            List<String> ids = entry.getValue();

            if (ids == null || ids.size() < 2) {
                continue;
            }

            Map<String, Object> nameTermEntity = entityBuilder.buildOntologyTermEntity(
                    "ObjectNameTerm",
                    name
            );

            brokerClient.upsertEntity(nameTermEntity, "ObjectNameTerm JSON 직렬화 실패: " + name);

            String termUrn = entityBuilder.buildOntologyTermUrn("ObjectNameTerm", name);

            for (String entityId : ids) {
                if (entityId == null || entityId.isBlank()) {
                    continue;
                }

                Map<String, Object> attrs = new LinkedHashMap<>();
                entityBuilder.addRelationshipIfNotNull(attrs, "hasNameTerm", termUrn);
                attrs.put("@context", entityBuilder.coreContext());

                brokerClient.patchEntityAttrs(entityId, attrs);
            }
        }
    }
}
