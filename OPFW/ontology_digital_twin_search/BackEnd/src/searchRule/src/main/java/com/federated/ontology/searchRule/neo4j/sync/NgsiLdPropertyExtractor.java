package com.federated.ontology.searchRule.neo4j.sync;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.ArrayList;
import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public class NgsiLdPropertyExtractor {

    private static final List<String> META_KEYS = List.of("@context", "id", "type");
    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

    public static Map<String, Object> extractProperties(Map<String, Object> ngsiLdEntity) {
        Map<String, Object> props = new LinkedHashMap<>();

        for (Map.Entry<String, Object> entry : ngsiLdEntity.entrySet()) {
            String key = entry.getKey();
            Object value = entry.getValue();

            if (META_KEYS.contains(key)) continue;

            if (value instanceof Map<?, ?> wrapped) {
                @SuppressWarnings("unchecked")
                Map<String, Object> map = (Map<String, Object>) wrapped;
                String fieldType = (String) map.get("type");

                if ("Property".equals(fieldType)) {
                    props.put(key, toNeo4jSafeValue(map.get("value")));
                }
            }
        }
        return props;
    }

    public static Map<String, Object> extractRelationships(Map<String, Object> ngsiLdEntity) {
        Map<String, Object> rels = new LinkedHashMap<>();

        for (Map.Entry<String, Object> entry : ngsiLdEntity.entrySet()) {
            String key = entry.getKey();
            Object value = entry.getValue();

            if (META_KEYS.contains(key)) continue;

            if (value instanceof Map<?, ?> wrapped) {
                @SuppressWarnings("unchecked")
                Map<String, Object> map = (Map<String, Object>) wrapped;
                String fieldType = (String) map.get("type");

                if ("Relationship".equals(fieldType)) {
                    rels.put(key, map.get("object"));
                }
            }
        }
        return rels;
    }

    private static Object toNeo4jSafeValue(Object value) {
        if (value == null) return null;

        if (value instanceof String || value instanceof Number || value instanceof Boolean) {
            return value;
        }

        if (value instanceof Collection<?> col) {
            boolean allPrimitive = col.stream().allMatch(
                    v -> v == null || v instanceof String || v instanceof Number || v instanceof Boolean);
            if (allPrimitive) {
                return new ArrayList<>(col);
            }
        }

        try {
            return OBJECT_MAPPER.writeValueAsString(value);
        } catch (JsonProcessingException e) {
            return value.toString();
        }
    }

    public static String extractId(Map<String, Object> ngsiLdEntity) {
        Object id = ngsiLdEntity.get("id");
        return id != null ? id.toString() : null;
    }

    public static String extractType(Map<String, Object> ngsiLdEntity) {
        Object type = ngsiLdEntity.get("type");
        return type != null ? type.toString() : null;
    }
}
