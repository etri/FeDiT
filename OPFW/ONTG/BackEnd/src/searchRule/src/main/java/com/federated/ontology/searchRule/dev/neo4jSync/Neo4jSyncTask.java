package com.federated.ontology.searchRule.dev.neo4jSync;

import com.federated.ontology.searchRule.neo4j.Neo4jRepositoryHolder;
import com.federated.ontology.searchRule.neo4j.entity.*;
import com.federated.ontology.searchRule.neo4j.repository.*;
import lombok.extern.slf4j.Slf4j;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Slf4j
public class Neo4jSyncTask implements Runnable {

    private static final int MAX_RETRIES = 3;
    private static final long[] RETRY_DELAYS_MS = {100, 200, 400};

    private final Neo4jRepositoryHolder repos;
    private final Neo4jSyncFailureLogger failureLogger;
    private final Map<String, Object> metadata;
    private final String action;
    private final String entityType;

    public Neo4jSyncTask(Neo4jRepositoryHolder repos,
                         Neo4jSyncFailureLogger failureLogger,
                         Map<String, Object> metadata,
                         String action,
                         String entityType) {
        this.repos = repos;
        this.failureLogger = failureLogger;
        this.metadata = metadata;
        this.action = action;
        this.entityType = entityType;
    }

    @Override
    public void run() {
        for (int attempt = 0; attempt <= MAX_RETRIES; attempt++) {
            try {
                switch (entityType) {
                    case "DigitalTwin" -> handleDigitalTwin();
                    case "DigitalObject" -> handleDigitalObject();
                    default -> log.warn("[Neo4jSync] 알 수 없는 entityType: {}", entityType);
                }
                return;
            } catch (Exception e) {
                if (isRetryable(e) && attempt < MAX_RETRIES) {
                    log.warn("[Neo4jSync] 재시도 {}/{}. entityType={}, error={}",
                            attempt + 1, MAX_RETRIES, entityType, e.getMessage());
                    sleep(RETRY_DELAYS_MS[attempt]);
                } else {
                    String id = getString("dtid") != null ? getString("dtid") : getString("objectId");
                    failureLogger.logFailure(entityType, id, metadata, e);
                    return;
                }
            }
        }
    }

    private boolean isRetryable(Exception e) {
        Throwable cause = e;
        while (cause != null) {
            String name = cause.getClass().getSimpleName();
            if (name.contains("Transient") || name.contains("Deadlock")) return true;
            cause = cause.getCause();
        }
        return false;
    }

    private void sleep(long ms) {
        try {
            Thread.sleep(ms);
        } catch (InterruptedException ie) {
            Thread.currentThread().interrupt();
        }
    }

    private void handleDigitalTwin() {
        String dtid = getString("dtid");
        switch (action) {
            case "create", "modify" -> upsertDigitalTwin(dtid);
            case "delete" -> deleteDigitalTwin(dtid);
            default -> log.warn("[Neo4jSync] 알 수 없는 action: {}, dtid: {}", action, dtid);
        }
    }

    private void upsertDigitalTwin(String dtid) {
        DigitalTwinNode node = repos.getTwinRepository().findById(dtid)
                .orElse(new DigitalTwinNode(dtid));

        node.setName(getString("name"));
        node.setDescription(getString("description"));
        node.setOwner(getString("owner"));
        node.setContactPoint(getString("contactPoint"));
        node.setCreator(getString("creator"));
        node.setCreationTime(getString("creationTime"));
        node.setCountryCode(getString("countryCode"));
        node.setClassificationTypeCode(getString("classificationTypeCode"));
        node.setClassificationCode(getString("classificationCode"));
        node.setMetaModel(getString("metaModel"));
        node.setMetaTypeModel(getString("metaTypeModel"));
        node.setPointOfAccess(getString("pointOfAccess"));
        node.setType(getString("type"));
        node.setSubjects(getStringList("subjects"));
        node.setKeywords(getStringList("keywords"));

        List<String> objectIds = getStringList("digitalTwinObjects");
        if (objectIds != null && !objectIds.isEmpty()) {
            List<DigitalTwinNode> objects = new ArrayList<>();
            for (String objectId : objectIds) {
                DigitalTwinNode target = repos.getTwinRepository().findById(objectId)
                        .orElseGet(() -> repos.getTwinRepository().save(new DigitalTwinNode(objectId)));
                objects.add(target);
            }
            node.setDigitalTwinObjects(objects);
        }

        List<String> sensorIds = getStringList("sensors");
        if (sensorIds != null && !sensorIds.isEmpty()) {
            List<SensorNode> sensorNodes = new ArrayList<>();
            for (String sensorId : sensorIds) {
                SensorNode sensor = repos.getSensorRepository().findById(sensorId)
                        .orElseGet(() -> repos.getSensorRepository().save(new SensorNode(sensorId)));
                sensorNodes.add(sensor);
            }
            node.setSensors(sensorNodes);
        }

        node.setSubjectTerms(resolveSubjectTerms(getStringList("subjects")));

        node.setKeywordTerms(resolveKeywordTerms(getStringList("keywords")));

        repos.getTwinRepository().save(node);
        log.info("[Neo4jSync] DigitalTwin {} 완료. dtid={}", action, dtid);
    }

    private void deleteDigitalTwin(String dtid) {
        if (repos.getTwinRepository().existsById(dtid)) {
            repos.getTwinRepository().deleteById(dtid);
            log.info("[Neo4jSync] DigitalTwin delete 완료. dtid={}", dtid);
        } else {
            log.warn("[Neo4jSync] DigitalTwin 삭제 대상 없음. dtid={}", dtid);
        }
    }

    private void handleDigitalObject() {
        String objectId = getString("objectId");
        switch (action) {
            case "create", "modify" -> upsertDigitalObject(objectId);
            case "delete" -> deleteDigitalObject(objectId);
            default -> log.warn("[Neo4jSync] 알 수 없는 action: {}, objectId: {}", action, objectId);
        }
    }

    private void upsertDigitalObject(String objectId) {
        DigitalObjectNode node = repos.getObjectRepository().findById(objectId)
                .orElse(new DigitalObjectNode(objectId));

        node.setName(getString("name"));
        node.setDescription(getString("description"));
        node.setKeywords(getStringList("keywords"));
        node.setSubjects(getStringList("subjects"));
        node.setTwinKeywords(getStringList("twinKeywords"));
        node.setTwinSubjects(getStringList("twinSubjects"));

        String parentTwinId = getString("parentTwinId");
        if (parentTwinId != null) {
            DigitalTwinNode parent = repos.getTwinRepository().findById(parentTwinId)
                    .orElseGet(() -> repos.getTwinRepository().save(new DigitalTwinNode(parentTwinId)));
            node.setParentTwin(parent);
        }

        node.setSubjectTerms(resolveSubjectTerms(getStringList("subjects")));

        node.setKeywordTerms(resolveKeywordTerms(getStringList("keywords")));

        String name = getString("name");
        if (name != null && !name.isBlank()) {
            String termId = buildTermUrn("ObjectNameTerm", name);
            ObjectNameTermNode nameTerm = repos.getObjectNameTermRepository().findById(termId)
                    .orElseGet(() -> repos.getObjectNameTermRepository().save(
                            new ObjectNameTermNode(termId, name)));
            node.setNameTerm(nameTerm);
        }

        repos.getObjectRepository().save(node);
        log.info("[Neo4jSync] DigitalObject {} 완료. objectId={}", action, objectId);
    }

    private void deleteDigitalObject(String objectId) {
        if (repos.getObjectRepository().existsById(objectId)) {
            repos.getObjectRepository().deleteById(objectId);
            log.info("[Neo4jSync] DigitalObject delete 완료. objectId={}", objectId);
        } else {
            log.warn("[Neo4jSync] DigitalObject 삭제 대상 없음. objectId={}", objectId);
        }
    }

    private List<SubjectTermNode> resolveSubjectTerms(List<String> subjects) {
        List<SubjectTermNode> terms = new ArrayList<>();
        if (subjects == null || subjects.isEmpty()) return terms;

        for (String label : subjects) {
            if (label == null || label.isBlank()) continue;
            String termId = buildTermUrn("SubjectTerm", label);
            SubjectTermNode term = repos.getSubjectTermRepository().findById(termId)
                    .orElseGet(() -> repos.getSubjectTermRepository().save(
                            new SubjectTermNode(termId, label)));
            terms.add(term);
        }
        return terms;
    }

    private List<KeywordTermNode> resolveKeywordTerms(List<String> keywords) {
        List<KeywordTermNode> terms = new ArrayList<>();
        if (keywords == null || keywords.isEmpty()) return terms;

        for (String label : keywords) {
            if (label == null || label.isBlank()) continue;
            String termId = buildTermUrn("KeywordTerm", label);
            KeywordTermNode term = repos.getKeywordTermRepository().findById(termId)
                    .orElseGet(() -> repos.getKeywordTermRepository().save(
                            new KeywordTermNode(termId, label)));
            terms.add(term);
        }
        return terms;
    }

    private String buildTermUrn(String termType, String label) {
        String normalized = normalizeForId(label);
        return "urn:ngsi-ld:" + termType + ":" + normalized;
    }

    private String normalizeForId(String raw) {
        if (raw == null || raw.isBlank()) return "EMPTY";
        try {
            String trimmed = raw.trim().replace(" ", "_");
            return URLEncoder.encode(trimmed, StandardCharsets.UTF_8)
                    .replace("+", "%20");
        } catch (Exception e) {
            return "ENCODE_ERROR";
        }
    }

    private String getString(String key) {
        Object value = metadata.get(key);
        return value != null ? value.toString() : null;
    }

    @SuppressWarnings("unchecked")
    private List<String> getStringList(String key) {
        Object value = metadata.get(key);
        if (value instanceof List<?> list) {
            List<String> result = new ArrayList<>();
            for (Object item : list) {
                if (item != null) result.add(item.toString());
            }
            return result;
        }
        return null;
    }
}
