package com.federated.ontology.searchRule.dev.neo4jSync;

import com.federated.ontology.searchRule.neo4j.Neo4jRepositoryHolder;
import com.federated.ontology.searchRule.neo4j.sync.NgsiLdPropertyExtractor;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.federated.ontology.searchRule.neo4j.entity.*;
import com.federated.ontology.searchRule.serviceImpl.ngsildClientServiceImpl.NgsiLdBrokerClient;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
public class Neo4jBulkSyncService {

    private final Neo4jRepositoryHolder repos;
    private final NgsiLdBrokerClient brokerClient;
    private final ObjectMapper objectMapper;

    public Neo4jBulkSyncService(Neo4jRepositoryHolder repos,
                                 NgsiLdBrokerClient brokerClient,
                                 ObjectMapper objectMapper) {
        this.repos = repos;
        this.brokerClient = brokerClient;
        this.objectMapper = objectMapper;
    }

    public int syncFromStellio() throws Exception {
        deleteAllNeo4j();

        String json = brokerClient.getEntities();
        if (json == null || json.isBlank()) {
            log.warn("[Neo4j Bulk] Stellio에 데이터가 없습니다. Neo4j 동기화 스킵.");
            return 0;
        }

        Map<String, List<Map<String, Object>>> entitiesByType = objectMapper.readValue(
                json, new TypeReference<Map<String, List<Map<String, Object>>>>() {});

        List<Map<String, Object>> twinMetadataList = entitiesByType.getOrDefault("DigitalTwin", List.of())
                .stream().map(e -> convertNgsiLdToMetadata(e, "DigitalTwin")).filter(Objects::nonNull).toList();

        List<Map<String, Object>> objectMetadataList = entitiesByType.getOrDefault("DigitalObject", List.of())
                .stream().map(e -> convertNgsiLdToMetadata(e, "DigitalObject")).filter(Objects::nonNull).toList();

        return bulkSave(twinMetadataList, objectMetadataList);
    }

    public int syncFromMetadataList(List<Map<String, Object>> twinMetadataList,
                                     List<Map<String, Object>> objectMetadataList) {
        return bulkSave(twinMetadataList, objectMetadataList);
    }

    private int bulkSave(List<Map<String, Object>> twinMetadataList,
                          List<Map<String, Object>> objectMetadataList) {

        log.info("[Neo4j Bulk] 벌크 저장 시작. twin={}, object={}",
                twinMetadataList.size(), objectMetadataList.size());

        Set<String> allSubjectLabels = new LinkedHashSet<>();
        Set<String> allKeywordLabels = new LinkedHashSet<>();

        for (Map<String, Object> m : twinMetadataList) {
            collectLabels(m, "subjects", allSubjectLabels);
            collectLabels(m, "keywords", allKeywordLabels);
        }
        for (Map<String, Object> m : objectMetadataList) {
            collectLabels(m, "subjects", allSubjectLabels);
            collectLabels(m, "keywords", allKeywordLabels);
        }

        Map<String, SubjectTermNode> subjectCache = saveSubjectTerms(allSubjectLabels);
        Map<String, KeywordTermNode> keywordCache = saveKeywordTerms(allKeywordLabels);

        Map<String, DigitalTwinNode> twinCache = saveTwinNodes(twinMetadataList, subjectCache, keywordCache);

        Map<String, ObjectNameTermNode> nameTermCache = saveObjectNameTerms(objectMetadataList);

        int objectCount = saveObjectNodes(objectMetadataList, twinCache, subjectCache, keywordCache, nameTermCache);

        int totalSaved = twinCache.size() + objectCount;
        log.info("[Neo4j Bulk] 벌크 저장 완료. total={}", totalSaved);
        return totalSaved;
    }

    @SuppressWarnings("unchecked")
    private Map<String, SubjectTermNode> saveSubjectTerms(Set<String> labels) {
        Map<String, SubjectTermNode> cache = new HashMap<>();
        if (labels.isEmpty()) return cache;

        List<SubjectTermNode> allNodes = new ArrayList<>();
        int existingCount = 0;
        for (String label : labels) {
            String termId = buildTermUrn("SubjectTerm", label);
            SubjectTermNode existing = repos.getSubjectTermRepository().findById(termId).orElse(null);
            if (existing != null) {
                allNodes.add(existing);
                existingCount++;
            } else {
                allNodes.add(new SubjectTermNode(termId, label));
            }
        }

        List<SubjectTermNode> saved = (List<SubjectTermNode>) repos.getSubjectTermRepository().saveAll(allNodes);
        saved.forEach(t -> cache.put(t.getLabel(), t));
        log.info("[Neo4j Bulk] SubjectTerm 처리 완료. existing={}, new={}", existingCount, allNodes.size() - existingCount);
        return cache;
    }

    @SuppressWarnings("unchecked")
    private Map<String, KeywordTermNode> saveKeywordTerms(Set<String> labels) {
        Map<String, KeywordTermNode> cache = new HashMap<>();
        if (labels.isEmpty()) return cache;

        List<KeywordTermNode> allNodes = new ArrayList<>();
        int existingCount = 0;
        for (String label : labels) {
            String termId = buildTermUrn("KeywordTerm", label);
            KeywordTermNode existing = repos.getKeywordTermRepository().findById(termId).orElse(null);
            if (existing != null) {
                allNodes.add(existing);
                existingCount++;
            } else {
                allNodes.add(new KeywordTermNode(termId, label));
            }
        }

        List<KeywordTermNode> saved = (List<KeywordTermNode>) repos.getKeywordTermRepository().saveAll(allNodes);
        saved.forEach(t -> cache.put(t.getLabel(), t));
        log.info("[Neo4j Bulk] KeywordTerm 처리 완료. existing={}, new={}", existingCount, allNodes.size() - existingCount);
        return cache;
    }

    @SuppressWarnings("unchecked")
    private Map<String, DigitalTwinNode> saveTwinNodes(List<Map<String, Object>> twinMetadataList,
                                                        Map<String, SubjectTermNode> subjectCache,
                                                        Map<String, KeywordTermNode> keywordCache) {
        Map<String, DigitalTwinNode> twinCache = new HashMap<>();
        if (twinMetadataList.isEmpty()) return twinCache;

        List<DigitalTwinNode> twinNodes = new ArrayList<>();
        for (Map<String, Object> m : twinMetadataList) {
            String dtid = (String) m.get("dtid");

            DigitalTwinNode node = repos.getTwinRepository().findById(dtid)
                    .orElse(new DigitalTwinNode(dtid));

            node.setName((String) m.get("name"));
            node.setDescription((String) m.get("description"));
            node.setOwner((String) m.get("owner"));
            node.setContactPoint((String) m.get("contactPoint"));
            node.setCreator((String) m.get("creator"));
            node.setCreationTime((String) m.get("creationTime"));
            node.setCountryCode((String) m.get("countryCode"));
            node.setClassificationTypeCode((String) m.get("classificationTypeCode"));
            node.setClassificationCode((String) m.get("classificationCode"));
            node.setMetaModel((String) m.get("metaModel"));
            node.setMetaTypeModel((String) m.get("metaTypeModel"));
            node.setPointOfAccess((String) m.get("pointOfAccess"));
            node.setType((String) m.get("type"));
            node.setSubjects(getStringList(m, "subjects"));
            node.setKeywords(getStringList(m, "keywords"));
            node.setSubjectTerms(resolveFromCache(getStringList(m, "subjects"), subjectCache));
            node.setKeywordTerms(resolveFromCache(getStringList(m, "keywords"), keywordCache));

            twinNodes.add(node);
        }

        List<DigitalTwinNode> savedTwins = (List<DigitalTwinNode>) repos.getTwinRepository().saveAll(twinNodes);
        savedTwins.forEach(t -> twinCache.put(t.getDtid(), t));
        log.info("[Neo4j Bulk] DigitalTwin saveAll 완료. count={}", savedTwins.size());
        return twinCache;
    }

    @SuppressWarnings("unchecked")
    private Map<String, ObjectNameTermNode> saveObjectNameTerms(List<Map<String, Object>> objectMetadataList) {
        Map<String, ObjectNameTermNode> cache = new HashMap<>();

        Set<String> names = new LinkedHashSet<>();
        for (Map<String, Object> m : objectMetadataList) {
            String name = (String) m.get("name");
            if (name != null && !name.isBlank()) names.add(name);
        }
        if (names.isEmpty()) return cache;

        List<ObjectNameTermNode> toSave = new ArrayList<>();
        for (String name : names) {
            String termId = buildTermUrn("ObjectNameTerm", name);
            ObjectNameTermNode existing = repos.getObjectNameTermRepository().findById(termId).orElse(null);
            if (existing != null) {
                cache.put(name, existing);
            } else {
                toSave.add(new ObjectNameTermNode(termId, name));
            }
        }

        if (!toSave.isEmpty()) {
            List<ObjectNameTermNode> saved = (List<ObjectNameTermNode>) repos.getObjectNameTermRepository()
                    .saveAll(toSave);
            saved.forEach(t -> cache.put(t.getLabel(), t));
        }
        log.info("[Neo4j Bulk] ObjectNameTerm 처리 완료. existing={}, new={}", cache.size() - toSave.size(), toSave.size());
        return cache;
    }

    private int saveObjectNodes(List<Map<String, Object>> objectMetadataList,
                                 Map<String, DigitalTwinNode> twinCache,
                                 Map<String, SubjectTermNode> subjectCache,
                                 Map<String, KeywordTermNode> keywordCache,
                                 Map<String, ObjectNameTermNode> nameTermCache) {
        if (objectMetadataList.isEmpty()) return 0;

        List<DigitalObjectNode> objectNodes = new ArrayList<>();
        for (Map<String, Object> m : objectMetadataList) {
            String objectId = (String) m.get("objectId");
            DigitalObjectNode node = new DigitalObjectNode(objectId);

            node.setName((String) m.get("name"));
            node.setDescription((String) m.get("description"));
            node.setKeywords(getStringList(m, "keywords"));
            node.setSubjects(getStringList(m, "subjects"));
            node.setTwinKeywords(getStringList(m, "twinKeywords"));
            node.setTwinSubjects(getStringList(m, "twinSubjects"));

            String parentTwinId = (String) m.get("parentTwinId");
            if (parentTwinId != null && twinCache.containsKey(parentTwinId)) {
                node.setParentTwin(twinCache.get(parentTwinId));
            }

            node.setSubjectTerms(resolveFromCache(getStringList(m, "subjects"), subjectCache));
            node.setKeywordTerms(resolveFromCache(getStringList(m, "keywords"), keywordCache));

            String name = (String) m.get("name");
            if (name != null && nameTermCache.containsKey(name)) {
                node.setNameTerm(nameTermCache.get(name));
            }

            objectNodes.add(node);
        }

        repos.getObjectRepository().saveAll(objectNodes);
        log.info("[Neo4j Bulk] DigitalObject saveAll 완료. count={}", objectNodes.size());
        return objectNodes.size();
    }

    private void deleteAllNeo4j() {
        repos.getObjectRepository().deleteAll();
        repos.getTwinRepository().deleteAll();
        repos.getSubjectTermRepository().deleteAll();
        repos.getKeywordTermRepository().deleteAll();
        repos.getObjectNameTermRepository().deleteAll();
        repos.getSensorRepository().deleteAll();
        log.info("[Neo4j Bulk] Neo4j 전체 삭제 완료.");
    }

    private Map<String, Object> convertNgsiLdToMetadata(Map<String, Object> ngsiLdEntity, String entityType) {
        String fullId = NgsiLdPropertyExtractor.extractId(ngsiLdEntity);
        if (fullId == null) return null;

        Map<String, Object> props = NgsiLdPropertyExtractor.extractProperties(ngsiLdEntity);
        Map<String, Object> rels = NgsiLdPropertyExtractor.extractRelationships(ngsiLdEntity);
        Map<String, Object> metadata = new HashMap<>(props);

        switch (entityType) {
            case "DigitalTwin" -> {
                metadata.put("dtid", stripUrnPrefix(fullId));
                if (rels.containsKey("hasDigitalObject"))
                    metadata.put("digitalTwinObjects", extractIdsFromRelationship(rels.get("hasDigitalObject")));
                if (rels.containsKey("hasSensor"))
                    metadata.put("sensors", extractIdsFromRelationship(rels.get("hasSensor")));
            }
            case "DigitalObject" -> {
                metadata.put("objectId", stripUrnPrefix(fullId));
                if (rels.containsKey("isDigitalObjectOf")) {
                    Object parentRef = rels.get("isDigitalObjectOf");
                    if (parentRef instanceof String parentUrn)
                        metadata.put("parentTwinId", stripUrnPrefix(parentUrn));
                }
            }
            default -> { return null; }
        }
        return metadata;
    }

    private String stripUrnPrefix(String urn) {
        if (urn == null) return null;
        int lastColon = urn.lastIndexOf(':');
        return lastColon >= 0 ? urn.substring(lastColon + 1) : urn;
    }

    private List<String> extractIdsFromRelationship(Object relValue) {
        if (relValue instanceof String urn) return List.of(stripUrnPrefix(urn));
        if (relValue instanceof List<?> list) {
            return list.stream().filter(String.class::isInstance).map(String.class::cast)
                    .map(this::stripUrnPrefix).toList();
        }
        return List.of();
    }

    private void collectLabels(Map<String, Object> metadata, String key, Set<String> target) {
        Object value = metadata.get(key);
        if (value instanceof List<?> list) {
            for (Object item : list) {
                if (item instanceof String s && !s.isBlank()) target.add(s);
            }
        }
    }

    private List<String> getStringList(Map<String, Object> metadata, String key) {
        Object value = metadata.get(key);
        if (value instanceof List<?> list) {
            return list.stream().filter(String.class::isInstance).map(String.class::cast).toList();
        }
        return null;
    }

    private <T> List<T> resolveFromCache(List<String> labels, Map<String, T> cache) {
        if (labels == null || labels.isEmpty()) return new ArrayList<>();
        return labels.stream().filter(cache::containsKey).map(cache::get).collect(Collectors.toList());
    }

    private String buildTermUrn(String termType, String label) {
        return "urn:ngsi-ld:" + termType + ":" + normalizeForId(label);
    }

    private String normalizeForId(String raw) {
        if (raw == null || raw.isBlank()) return "EMPTY";
        try {
            return URLEncoder.encode(raw.trim().replace(" ", "_"), StandardCharsets.UTF_8).replace("+", "%20");
        } catch (Exception e) { return "ENCODE_ERROR"; }
    }
}
