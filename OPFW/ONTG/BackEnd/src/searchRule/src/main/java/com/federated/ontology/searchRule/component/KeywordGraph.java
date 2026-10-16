package com.federated.ontology.searchRule.component;

import org.springframework.stereotype.Component;

import java.util.*;

@Component
public class KeywordGraph {

    private final Map<String, Set<String>> keywordToObjectIds = new HashMap<>();

    private final Map<String, Set<String>> objectIdToKeywords = new HashMap<>();

    private final Map<String, String> objectIdToTwinId = new HashMap<>();

    private final Map<String, Set<String>> twinIdToObjectIds = new HashMap<>();

    private boolean initialized = false;

    public synchronized void clear() {
        keywordToObjectIds.clear();
        objectIdToKeywords.clear();
        objectIdToTwinId.clear();
        twinIdToObjectIds.clear();
        initialized = false;
    }

    public synchronized void markInitialized() {
        this.initialized = true;
    }

    public boolean isInitialized() {
        return initialized;
    }

    @SuppressWarnings("unchecked")
    public synchronized void addObjectEntity(Map<String, Object> entity) {
        if (entity == null) return;

        Object idObj = entity.get("id");
        if (idObj == null) return;

        String objectId = idObj.toString();

        Set<String> keywords = extractStringValues(entity.get("keywords"));
        if (!keywords.isEmpty()) {
            objectIdToKeywords.put(objectId, keywords);

            for (String kw : keywords) {
                keywordToObjectIds
                        .computeIfAbsent(kw, k -> new HashSet<>())
                        .add(objectId);
            }
        }

        String twinId = extractRelationshipObjectId(entity, "isDigitalObjectOf");
        if (twinId != null) {
            objectIdToTwinId.put(objectId, twinId);

            twinIdToObjectIds
                    .computeIfAbsent(twinId, k -> new HashSet<>())
                    .add(objectId);
        }
    }

    public Set<String> getObjectIdsByKeyword(String keyword) {
        return keywordToObjectIds.getOrDefault(keyword, Collections.emptySet());
    }

    public Set<String> getKeywordsByObjectId(String objectId) {
        return objectIdToKeywords.getOrDefault(objectId, Collections.emptySet());
    }

    public String getTwinIdByObjectId(String objectId) {
        return objectIdToTwinId.get(objectId);
    }

    public Set<String> getObjectIdsByTwinId(String twinId) {
        return twinIdToObjectIds.getOrDefault(twinId, Collections.emptySet());
    }

    @SuppressWarnings("unchecked")
    private Set<String> extractStringValues(Object attr) {
        Set<String> result = new LinkedHashSet<>();
        if (attr == null) {
            return result;
        }

        if (attr instanceof Map<?, ?> map) {
            Object value = map.get("value");
            if (value instanceof Collection<?> col) {
                for (Object v : col) {
                    if (v != null) {
                        result.add(v.toString());
                    }
                }
            } else if (value != null) {
                result.add(value.toString());
            }
            return result;
        }

        if (attr instanceof Collection<?> col) {
            for (Object v : col) {
                if (v != null) {
                    result.add(v.toString());
                }
            }
            return result;
        }

        result.add(attr.toString());
        return result;
    }

    @SuppressWarnings("unchecked")
    private String extractRelationshipObjectId(Map<String, Object> entity, String relName) {
        Object rel = entity.get(relName);
        if (rel == null) {
            return null;
        }

        if (rel instanceof Map<?, ?> map) {
            Object obj = map.get("object");
            return (obj != null) ? obj.toString() : null;
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
}
