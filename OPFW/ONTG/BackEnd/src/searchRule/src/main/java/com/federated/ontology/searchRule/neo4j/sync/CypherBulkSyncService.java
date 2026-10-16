package com.federated.ontology.searchRule.neo4j.sync;

import com.federated.ontology.searchRule.dev.neo4jSync.Neo4jSyncTask;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.federated.ontology.searchRule.neo4j.sync.NgsiLdPropertyExtractor;
import com.federated.ontology.searchRule.serviceImpl.ngsildClientServiceImpl.NgsiLdBrokerClient;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.neo4j.core.Neo4jClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.annotation.PostConstruct;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
public class CypherBulkSyncService {

    private final Neo4jClient neo4jClient;
    private final NgsiLdBrokerClient brokerClient;
    private final ObjectMapper objectMapper;

    public CypherBulkSyncService(Neo4jClient neo4jClient,
                                  NgsiLdBrokerClient brokerClient,
                                  ObjectMapper objectMapper) {
        this.neo4jClient = neo4jClient;
        this.brokerClient = brokerClient;
        this.objectMapper = objectMapper;
    }

    @PostConstruct
    public void ensureIndexes() {
        neo4jClient.query("CREATE INDEX IF NOT EXISTS FOR (n:DigitalTwin) ON (n.dtid)").run();
        neo4jClient.query("CREATE INDEX IF NOT EXISTS FOR (n:DigitalObject) ON (n.objectId)").run();
        neo4jClient.query("CREATE INDEX IF NOT EXISTS FOR (n:SubjectTerm) ON (n.id)").run();
        neo4jClient.query("CREATE INDEX IF NOT EXISTS FOR (n:KeywordTerm) ON (n.id)").run();
        neo4jClient.query("CREATE INDEX IF NOT EXISTS FOR (n:ObjectNameTerm) ON (n.id)").run();
        log.info("[Cypher Bulk] Neo4j 인덱스 확인 완료.");
    }

    @Transactional("neo4jTransactionManager")
    public int syncFromMetadataList(List<Map<String, Object>> twinMetadataList,
                                     List<Map<String, Object>> objectMetadataList) {
        return bulkSave(twinMetadataList, objectMetadataList);
    }

    @Transactional("neo4jTransactionManager")
    public int syncFromStellio() throws Exception {
        deleteAllNeo4j();

        String json = brokerClient.getEntities();
        if (json == null || json.isBlank()) {
            log.warn("[Cypher Bulk] Stellio에 데이터가 없습니다. Neo4j 동기화 스킵.");
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

    public void deleteEntity(String entityType, String entityId) {
        if (entityId == null) return;

        String idField = "DigitalObject".equals(entityType) ? "objectId" : "dtid";

        neo4jClient.query(
                "MATCH (n:" + entityType + " {" + idField + ": $id}) DETACH DELETE n"
        )
        .bind(entityId).to("id")
        .run();

        log.info("[Cypher Bulk] {} 삭제 완료. id={}", entityType, entityId);
    }

    private int bulkSave(List<Map<String, Object>> twinMetadataList,
                          List<Map<String, Object>> objectMetadataList) {

        log.info("[Cypher Bulk] 벌크 저장 시작. twin={}, object={}",
                twinMetadataList.size(), objectMetadataList.size());

        neo4jClient.query("MATCH (n:Recent) REMOVE n:Recent").run();

        Set<String> allSubjectLabels = new LinkedHashSet<>();
        Set<String> allKeywordLabels = new LinkedHashSet<>();
        Set<String> allObjectNames = new LinkedHashSet<>();

        for (Map<String, Object> m : twinMetadataList) {
            collectLabels(m, "subjects", allSubjectLabels);
            collectLabels(m, "keywords", allKeywordLabels);
        }
        for (Map<String, Object> m : objectMetadataList) {
            collectLabels(m, "subjects", allSubjectLabels);
            collectLabels(m, "keywords", allKeywordLabels);
            String name = (String) m.get("name");
            if (name != null && !name.isBlank()) allObjectNames.add(name);
        }

        mergeTermNodes("SubjectTerm", allSubjectLabels);
        mergeTermNodes("KeywordTerm", allKeywordLabels);
        mergeTermNodes("ObjectNameTerm", allObjectNames);

        if (!twinMetadataList.isEmpty()) {
            mergeTwinNodes(twinMetadataList);

            List<String> dtids = twinMetadataList.stream()
                    .map(m -> (String) m.get("dtid"))
                    .filter(Objects::nonNull)
                    .toList();

            clearAndCreateTermRels("DigitalTwin", "dtid", "HAS_SUBJECT_TERM", "SubjectTerm",
                    dtids, twinMetadataList, "subjects");
            clearAndCreateTermRels("DigitalTwin", "dtid", "HAS_KEYWORD_TERM", "KeywordTerm",
                    dtids, twinMetadataList, "keywords");
        }

        int objectCount = 0;
        if (!objectMetadataList.isEmpty()) {
            mergeObjectNodes(objectMetadataList);
            objectCount = objectMetadataList.size();

            List<String> objectIds = objectMetadataList.stream()
                    .map(m -> (String) m.get("objectId"))
                    .filter(Objects::nonNull)
                    .toList();

            createParentTwinRels(objectMetadataList);

            clearAndCreateTermRels("DigitalObject", "objectId", "HAS_SUBJECT_TERM", "SubjectTerm",
                    objectIds, objectMetadataList, "subjects");
            clearAndCreateTermRels("DigitalObject", "objectId", "HAS_KEYWORD_TERM", "KeywordTerm",
                    objectIds, objectMetadataList, "keywords");
            clearAndCreateNameTermRels(objectIds, objectMetadataList);
        }

        int totalSaved = twinMetadataList.size() + objectCount;
        log.info("[Cypher Bulk] 벌크 저장 완료. total={}", totalSaved);
        return totalSaved;
    }

    private void mergeTermNodes(String termLabel, Set<String> labels) {
        if (labels.isEmpty()) return;

        List<Map<String, Object>> batch = labels.stream()
                .map(label -> Map.<String, Object>of(
                        "id", buildTermUrn(termLabel, label),
                        "label", label
                ))
                .toList();

        neo4jClient.query(
                "UNWIND $batch AS row " +
                "MERGE (t:" + termLabel + " {id: row.id}) " +
                "SET t.label = row.label"
        )
        .bind(batch).to("batch")
        .run();

        log.info("[Cypher Bulk] {} MERGE 완료. count={}", termLabel, batch.size());
    }

    private void mergeTwinNodes(List<Map<String, Object>> twinMetadataList) {
        List<Map<String, Object>> batch = new ArrayList<>();
        for (Map<String, Object> m : twinMetadataList) {
            Map<String, Object> props = new HashMap<>(m);
            String dtid = (String) props.remove("dtid");
            if (dtid == null) continue;

            props.remove("digitalTwinObjects");
            props.remove("sensors");

            batch.add(Map.of("dtid", dtid, "props", props));
        }

        if (batch.isEmpty()) return;

        neo4jClient.query(
                "UNWIND $batch AS row " +
                "MERGE (n:DigitalTwin {dtid: row.dtid}) " +
                "SET n += row.props, n.createdAt = datetime(), n:Recent"
        )
        .bind(batch).to("batch")
        .run();

        log.info("[Cypher Bulk] DigitalTwin MERGE 완료. count={}", batch.size());
    }

    private void mergeObjectNodes(List<Map<String, Object>> objectMetadataList) {
        List<Map<String, Object>> batch = new ArrayList<>();
        for (Map<String, Object> m : objectMetadataList) {
            Map<String, Object> props = new HashMap<>(m);
            String objectId = (String) props.remove("objectId");
            if (objectId == null) continue;

            props.remove("parentTwinId");

            batch.add(Map.of("objectId", objectId, "props", props));
        }

        if (batch.isEmpty()) return;

        neo4jClient.query(
                "UNWIND $batch AS row " +
                "MERGE (n:DigitalObject {objectId: row.objectId}) " +
                "SET n += row.props, n.createdAt = datetime(), n:Recent"
        )
        .bind(batch).to("batch")
        .run();

        log.info("[Cypher Bulk] DigitalObject MERGE 완료. count={}", batch.size());
    }

    private void clearAndCreateTermRels(String sourceLabel, String idField, String relType,
                                         String termLabel, List<String> ids,
                                         List<Map<String, Object>> metadataList, String fieldName) {
        neo4jClient.query(
                "UNWIND $ids AS id " +
                "MATCH (n:" + sourceLabel + " {" + idField + ": id})-[r:" + relType + "]->() " +
                "DELETE r"
        )
        .bind(ids).to("ids")
        .run();

        List<Map<String, Object>> batch = new ArrayList<>();
        for (Map<String, Object> m : metadataList) {
            String sourceId = (String) m.get(idField);
            List<String> labels = getStringList(m, fieldName);
            if (sourceId == null || labels == null) continue;

            for (String label : labels) {
                if (label == null || label.isBlank()) continue;
                batch.add(Map.of(
                        "sourceId", sourceId,
                        "termId", buildTermUrn(termLabel, label)
                ));
            }
        }

        if (batch.isEmpty()) return;

        neo4jClient.query(
                "UNWIND $batch AS row " +
                "MATCH (n:" + sourceLabel + " {" + idField + ": row.sourceId}) " +
                "MERGE (t:" + termLabel + " {id: row.termId}) " +
                "MERGE (n)-[:" + relType + "]->(t)"
        )
        .bind(batch).to("batch")
        .run();

        log.info("[Cypher Bulk] {} -[{}]-> {} 관계 재생성 완료. count={}", sourceLabel, relType, termLabel, batch.size());
    }

    private void createParentTwinRels(List<Map<String, Object>> objectMetadataList) {
        List<Map<String, Object>> batch = new ArrayList<>();
        for (Map<String, Object> m : objectMetadataList) {
            String objectId = (String) m.get("objectId");
            String parentTwinId = (String) m.get("parentTwinId");
            if (objectId != null && parentTwinId != null) {
                batch.add(Map.of("objectId", objectId, "parentTwinId", parentTwinId));
            }
        }

        if (batch.isEmpty()) return;

        neo4jClient.query(
                "UNWIND $batch AS row " +
                "MATCH (o:DigitalObject {objectId: row.objectId}) " +
                "MATCH (t:DigitalTwin {dtid: row.parentTwinId}) " +
                "MERGE (o)-[:IS_DIGITAL_OBJECT_OF]->(t)"
        )
        .bind(batch).to("batch")
        .run();

        log.info("[Cypher Bulk] IS_DIGITAL_OBJECT_OF 관계 생성 완료. count={}", batch.size());
    }

    private void clearAndCreateNameTermRels(List<String> objectIds,
                                             List<Map<String, Object>> objectMetadataList) {
        neo4jClient.query(
                "UNWIND $ids AS id " +
                "MATCH (n:DigitalObject {objectId: id})-[r:HAS_NAME_TERM]->() " +
                "DELETE r"
        )
        .bind(objectIds).to("ids")
        .run();

        List<Map<String, Object>> batch = new ArrayList<>();
        for (Map<String, Object> m : objectMetadataList) {
            String objectId = (String) m.get("objectId");
            String name = (String) m.get("name");
            if (objectId != null && name != null && !name.isBlank()) {
                batch.add(Map.of(
                        "objectId", objectId,
                        "termId", buildTermUrn("ObjectNameTerm", name)
                ));
            }
        }

        if (batch.isEmpty()) return;

        neo4jClient.query(
                "UNWIND $batch AS row " +
                "MATCH (o:DigitalObject {objectId: row.objectId}) " +
                "MERGE (t:ObjectNameTerm {id: row.termId}) " +
                "MERGE (o)-[:HAS_NAME_TERM]->(t)"
        )
        .bind(batch).to("batch")
        .run();

        log.info("[Cypher Bulk] HAS_NAME_TERM 관계 재생성 완료. count={}", batch.size());
    }

    public void deleteAllNeo4j() {
        neo4jClient.query("MATCH (n) DETACH DELETE n").run();
        log.info("[Cypher Bulk] Neo4j 전체 삭제 완료.");
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
