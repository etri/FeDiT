package com.federated.ontology.searchRule.serviceImpl.ngsildClientServiceImpl;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Component
public class NgsiLdBrokerClient {

    @Value("${stellio.broker.base-url}")
    private String brokerBaseUrl;

    @Value("${ngsild.pagination.limit:100}")
    private int paginationLimit;

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    public NgsiLdBrokerClient(RestTemplate restTemplate, ObjectMapper objectMapper) {
        this.restTemplate = restTemplate;
        this.objectMapper = objectMapper;
    }

    public String getBrokerUrl() {
        return brokerBaseUrl + "/entities";
    }

    private HttpEntity<String> createAcceptJsonLdEntity() {
        HttpHeaders headers = new HttpHeaders();
        headers.add("Accept", "application/ld+json");
        return new HttpEntity<>(headers);
    }

    private ResponseEntity<Map> getTypes(HttpEntity<String> entity) {
        String url = brokerBaseUrl + "/types";
        return restTemplate.exchange(url, HttpMethod.GET, entity, Map.class);
    }

    @SuppressWarnings("unchecked")
    private List<String> fetchTypeList(HttpEntity<String> entity) {
        ResponseEntity<Map> typeResponse = getTypes(entity);
        Map body = typeResponse.getBody();
        if (body == null) {
            return Collections.emptyList();
        }

        List<String> typeList = (List<String>) body.get("typeList");
        if (typeList == null) {
            return Collections.emptyList();
        }

        return typeList;
    }

    public void saveNgsiLdEntity(String jsonEntity) {
        sendUpsertRequest(jsonEntity, false);
    }

    public void updateNgsiLdEntity(String jsonEntity) {
        sendUpsertRequest(jsonEntity, true);
    }

    private void sendUpsertRequest(String jsonEntity, boolean isUpdate) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.parseMediaType("application/ld+json"));

            String url = brokerBaseUrl + "/entityOperations/upsert";
            if (isUpdate) {
                url += "?options=update";
            }

            String upsertBody = "[" + jsonEntity + "]";
            HttpEntity<String> request = new HttpEntity<>(upsertBody, headers);

            ResponseEntity<String> response = restTemplate.postForEntity(url, request, String.class);

            log.info("NGSI-LD Upsert 완료 (Update 모드: {}), Status: {}", isUpdate, response.getStatusCode());
        } catch (HttpStatusCodeException e) {
            log.error("HTTP 에러 발생: {}, 상세: {}", e.getStatusCode(), e.getResponseBodyAsString());
            throw e;
        } catch (Exception e) {
            log.error("알 수 없는 에러 발생", e);
            throw e;
        }
    }

    public int batchDeleteEntities(List<String> entityIds) {
        if (entityIds == null || entityIds.isEmpty()) return 0;

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            String url = brokerBaseUrl + "/entityOperations/delete";
            String body = objectMapper.writeValueAsString(entityIds);
            HttpEntity<String> request = new HttpEntity<>(body, headers);

            ResponseEntity<String> response = restTemplate.postForEntity(url, request, String.class);
            log.info("[Stellio] 배치 삭제 완료. count={}, status={}", entityIds.size(), response.getStatusCode());
            return entityIds.size();
        } catch (HttpStatusCodeException e) {
            log.error("[Stellio] 배치 삭제 HTTP 에러: {}, 상세: {}", e.getStatusCode(), e.getResponseBodyAsString());
            throw e;
        } catch (Exception e) {
            log.error("[Stellio] 배치 삭제 실패", e);
            throw new RuntimeException("배치 삭제 실패", e);
        }
    }

    public void replaceEntity(Map<String, Object> entity, String errorMessage) {
        try {
            String jsonEntity = objectMapper.writeValueAsString(entity);
            saveNgsiLdEntity(jsonEntity);
        } catch (JsonProcessingException e) {
            throw new RuntimeException(errorMessage, e);
        }
    }

    public void updateEntity(Map<String, Object> entity, String errorMessage) {
        try {
            String jsonEntity = objectMapper.writeValueAsString(entity);
            updateNgsiLdEntity(jsonEntity);
        } catch (JsonProcessingException e) {
            throw new RuntimeException(errorMessage, e);
        }
    }

    public void upsertEntity(Map<String, Object> entity, String errorMessage) {
        replaceEntity(entity, errorMessage);
    }

    public boolean deleteEntity(String entityId) {
        try {
            String url = brokerBaseUrl + "/entities/" + entityId;
            restTemplate.exchange(url, HttpMethod.DELETE, null, Void.class);
            log.info("NGSI-LD 엔티티 삭제 완료: {}", entityId);
            return true;
        } catch (HttpStatusCodeException e) {
            log.error("엔티티 삭제 HTTP 에러: {}, 상세: {}", e.getStatusCode(), e.getResponseBodyAsString());
            return false;
        } catch (Exception e) {
            log.error("엔티티 삭제 실패: {}", entityId, e);
            return false;
        }
    }

    public String getEntity(String entityId) {
        String url = brokerBaseUrl + "/entities/" + entityId;
        HttpEntity<String> entity = createAcceptJsonLdEntity();

        ResponseEntity<String> response = restTemplate.exchange(
                url, HttpMethod.GET, entity, String.class);

        return response.getBody();
    }

    public String getEntities() {
        HttpEntity<String> entity = createAcceptJsonLdEntity();
        List<String> typeList = fetchTypeList(entity);

        Map<String, List<Map<String, Object>>> result = new LinkedHashMap<>();

        if (!typeList.isEmpty()) {
            final String entitiesUrl = brokerBaseUrl + "/entities";
            final int limit = paginationLimit;

            for (String type : typeList) {
                List<Map<String, Object>> allEntitiesOfType = new ArrayList<>();

                int offset = 0;

                while (true) {
                    String searchUrl = entitiesUrl
                            + "?type=" + type
                            + "&limit=" + limit
                            + "&offset=" + offset;

                    ResponseEntity<List> entityResponse = restTemplate.exchange(
                            searchUrl,
                            HttpMethod.GET,
                            entity,
                            List.class
                    );

                    @SuppressWarnings("unchecked")
                    List<Map<String, Object>> entitiesPage =
                            (List<Map<String, Object>>) entityResponse.getBody();

                    if (entitiesPage == null || entitiesPage.isEmpty()) {
                        break;
                    }

                    allEntitiesOfType.addAll(entitiesPage);

                    if (entitiesPage.size() < limit) {
                        break;
                    }

                    offset += entitiesPage.size();
                }

                result.put(type, allEntitiesOfType);
            }
        }

        try {
            return objectMapper.writeValueAsString(result);
        } catch (Exception e) {
            throw new RuntimeException("JSON 직렬화 실패", e);
        }
    }

    public String deleteEntities() {
        HttpEntity<String> entity = createAcceptJsonLdEntity();
        List<String> typeList = fetchTypeList(entity);

        Map<String, List<String>> result = new LinkedHashMap<>();

        if (!typeList.isEmpty()) {
            for (String type : typeList) {
                List<String> deletedIds = deleteEntitiesByType(type, entity);
                result.put(type, deletedIds);
            }
        }

        try {
            return objectMapper.writeValueAsString(result);
        } catch (Exception e) {
            throw new RuntimeException("JSON 직렬화 실패", e);
        }
    }

    private List<String> deleteEntitiesByType(String type, HttpEntity<?> httpEntity) {
        final int limit = paginationLimit;
        final String entitiesUrl = brokerBaseUrl + "/entities";

        List<String> deletedIds = new ArrayList<>();

        while (true) {
            String searchUrl = entitiesUrl + "?type=" + type + "&limit=" + limit;

            ResponseEntity<List> entityResponse = restTemplate.exchange(
                    searchUrl,
                    HttpMethod.GET,
                    httpEntity,
                    List.class
            );

            @SuppressWarnings("unchecked")
            List<Map<String, Object>> entitiesOfType =
                    (List<Map<String, Object>>) entityResponse.getBody();

            if (entitiesOfType == null || entitiesOfType.isEmpty()) {
                break;
            }

            List<String> ids = entitiesOfType.stream()
                    .map(e -> e.get("id"))
                    .filter(id -> id != null)
                    .map(String::valueOf)
                    .toList();

            if (!ids.isEmpty()) {
                batchDeleteEntities(ids);
                deletedIds.addAll(ids);
            }
        }

        return deletedIds;
    }

    public void patchEntityAttrs(String entityId, Map<String, Object> attrs) {
        if (attrs == null || attrs.isEmpty()) return;

        try {
            String url = brokerBaseUrl + "/entities/" + entityId + "/attrs";

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.parseMediaType("application/ld+json"));

            String json = objectMapper.writeValueAsString(attrs);
            HttpEntity<String> request = new HttpEntity<>(json, headers);

            restTemplate.exchange(url, HttpMethod.PATCH, request, Void.class);
        } catch (Exception e) {
            throw new RuntimeException("엔티티 attrs PATCH 실패: " + entityId, e);
        }
    }
}
