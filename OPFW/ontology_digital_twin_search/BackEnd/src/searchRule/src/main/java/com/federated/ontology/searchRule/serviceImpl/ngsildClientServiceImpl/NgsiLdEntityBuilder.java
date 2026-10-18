package com.federated.ontology.searchRule.serviceImpl.ngsildClientServiceImpl;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Slf4j
@Component
public class NgsiLdEntityBuilder {

    public List<String> coreContext() {
        return List.of("https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld");
    }

    public String getStringField(Map<String, Object> map, String key, String defaultValue) {
        Object value = map.get(key);
        return value != null ? value.toString() : defaultValue;
    }

    public void addRelationshipIfNotNull(Map<String, Object> entity, String attrName, Object value) {
        if (value == null) return;

        Map<String, Object> prop = new HashMap<>();
        prop.put("type", "Relationship");
        prop.put("object", value);
        entity.put(attrName, prop);
    }

    public void addPropertyIfNotNull(Map<String, Object> entity, String attrName, Object value) {
        if (value == null) return;

        if (value instanceof Collection<?> col) {
            List<Object> cleaned = new ArrayList<>();
            for (Object v : col) {
                if (v != null) cleaned.add(v);
            }
            if (cleaned.isEmpty()) {
                return;
            }

            Map<String, Object> prop = new HashMap<>();
            prop.put("type", "Property");
            prop.put("value", cleaned);
            entity.put(attrName, prop);
            return;
        }

        Map<String, Object> prop = new HashMap<>();
        prop.put("type", "Property");
        prop.put("value", value);
        entity.put(attrName, prop);
    }

    public Object nonNullListOrNull(Object value) {
        if (!(value instanceof List<?> list)) return value;

        List<Object> cleaned = new ArrayList<>();
        for (Object v : list) {
            if (v != null) cleaned.add(v);
        }
        return cleaned;
    }

    public void addMultiObjectRelationship(Map<String, Object> entity,
                                           String attrName,
                                           Collection<String> objectIds) {

        if (objectIds == null || objectIds.isEmpty()) return;

        List<String> cleaned = new ArrayList<>();
        for (String id : objectIds) {
            if (id != null && !id.isBlank()) cleaned.add(id);
        }
        if (cleaned.isEmpty()) return;

        Map<String, Object> rel = new HashMap<>();
        rel.put("type", "Relationship");
        rel.put("object", cleaned);

        entity.put(attrName, rel);
    }

    public String buildOntologyTermUrn(String termType, String label) {
        return "urn:ngsi-ld:" + termType + ":" + normalizeForId(label);
    }

    public String normalizeForId(String raw) {
        if (raw == null || raw.isBlank()) return "EMPTY";

        try {
            String trimmed = raw.trim().replace(" ", "_");
            return URLEncoder.encode(trimmed, StandardCharsets.UTF_8)
                    .replace("+", "%20");
        } catch (Exception e) {
            return "ENCODE_ERROR";
        }
    }

    public Map<String, Object> buildOntologyTermEntity(String termType, String label) {
        Map<String, Object> term = new LinkedHashMap<>();

        String termId = buildOntologyTermUrn(termType, label);

        term.put("id", termId);
        term.put("type", termType);

        Map<String, Object> labelProp = new HashMap<>();
        labelProp.put("type", "Property");
        labelProp.put("value", label);
        term.put("label", labelProp);

        term.put("@context", coreContext());

        return term;
    }

    public void extractOntologyTermIds(Object value, String termType, Set<String> target) {
        if (value == null) return;

        if (value instanceof String s) {
            target.add(buildOntologyTermUrn(termType, s));
        } else if (value instanceof List<?>) {
            for (Object elem : (List<?>) value) {
                if (elem instanceof String s) {
                    target.add(buildOntologyTermUrn(termType, s));
                }
            }
        } else {
            log.debug("Unexpected type in extractOntologyTermIds: {}", value.getClass());
        }
    }

    public Map<String, Object> buildDigitalTwinEntity(Map<String, Object> twin, String twinId) {
        Map<String, Object> twinEntity = new LinkedHashMap<>();
        twinEntity.put("id", "urn:ngsi-ld:DigitalTwin:" + twinId);
        twinEntity.put("type", "DigitalTwin");

        addPropertyIfNotNull(twinEntity, "name", twin.get("digital_twin_name"));
        addPropertyIfNotNull(twinEntity, "description", twin.get("description"));
        addPropertyIfNotNull(twinEntity, "owner", twin.get("owner"));
        addPropertyIfNotNull(twinEntity, "keywords", nonNullListOrNull(twin.get("keywords")));
        addPropertyIfNotNull(twinEntity, "subjects", nonNullListOrNull(twin.get("subjects")));

        twinEntity.put("@context", coreContext());
        return twinEntity;
    }

    public Map<String, Object> buildDigitalTwinEntityFromKafka(Map<String, Object> metadata, String key) {
        Map<String, Object> entity = new LinkedHashMap<>();
        entity.put("id", "urn:ngsi-ld:DigitalTwin:" + key);
        entity.put("type", "DigitalTwin");

        addPropertyIfNotNull(entity, "name", metadata.get("name"));
        addPropertyIfNotNull(entity, "description", metadata.get("description"));
        addPropertyIfNotNull(entity, "owner", metadata.get("owner"));
        addPropertyIfNotNull(entity, "contactPoint", metadata.get("contactPoint"));
        addPropertyIfNotNull(entity, "creator", metadata.get("creator"));
        addPropertyIfNotNull(entity, "creationTime", metadata.get("creationTime"));
        addPropertyIfNotNull(entity, "modificationTime", metadata.get("modificationTime"));
        addPropertyIfNotNull(entity, "keywords", nonNullListOrNull(metadata.get("keywords")));
        addPropertyIfNotNull(entity, "subjects", nonNullListOrNull(metadata.get("subjects")));
        addPropertyIfNotNull(entity, "pointOfAccess", metadata.get("pointOfAccess"));
        addPropertyIfNotNull(entity, "countryCode", metadata.get("countryCode"));
        addPropertyIfNotNull(entity, "classificationTypeCode", metadata.get("classificationTypeCode"));
        addPropertyIfNotNull(entity, "classificationCode", metadata.get("classificationCode"));

        entity.put("@context", coreContext());
        return entity;
    }

    public Map<String, Object> buildDigitalObjectEntityFromKafka(Map<String, Object> metadata,
                                                                  String key,
                                                                  String parentTwinId) {
        Map<String, Object> entity = new LinkedHashMap<>();
        entity.put("id", "urn:ngsi-ld:DigitalObject:" + key);
        entity.put("type", "DigitalObject");

        if (parentTwinId != null) {
            addRelationshipIfNotNull(entity, "isDigitalObjectOf",
                    "urn:ngsi-ld:DigitalTwin:" + parentTwinId);
        }

        addPropertyIfNotNull(entity, "name", metadata.get("name"));
        addPropertyIfNotNull(entity, "description", metadata.get("description"));
        addPropertyIfNotNull(entity, "creationTime", metadata.get("creationTime"));
        addPropertyIfNotNull(entity, "modificationTime", metadata.get("modificationTime"));
        addPropertyIfNotNull(entity, "keywords", nonNullListOrNull(metadata.get("keywords")));
        addPropertyIfNotNull(entity, "subjects", nonNullListOrNull(metadata.get("subjects")));
        addPropertyIfNotNull(entity, "countryCode", metadata.get("countryCode"));
        addPropertyIfNotNull(entity, "objectPrimaryClassificationCode", metadata.get("objectPrimaryClassificationCode"));
        addPropertyIfNotNull(entity, "objectSecondaryClassificationCode", metadata.get("objectSecondaryClassificationCode"));

        entity.put("@context", coreContext());
        return entity;
    }

    public Map<String, Object> buildDigitalObjectEntity(Map<String, Object> twin,
                                                        Map<String, Object> tObject,
                                                        String twinId) {
        Map<String, Object> objEntity = new HashMap<>();

        String digitalObjectId = getStringField(tObject, "digital_object_id", "UNKNOWN_OBJECT_ID");

        objEntity.put("id", "urn:ngsi-ld:DigitalObject:" + digitalObjectId);
        objEntity.put("type", "DigitalObject");

        addRelationshipIfNotNull(objEntity, "isDigitalObjectOf",
                "urn:ngsi-ld:DigitalTwin:" + twinId);

        addPropertyIfNotNull(objEntity, "twinKeywords", nonNullListOrNull(twin.get("keywords")));
        addPropertyIfNotNull(objEntity, "twinSubjects", nonNullListOrNull(twin.get("subjects")));
        addPropertyIfNotNull(objEntity, "name", tObject.get("digital_object_name"));
        addPropertyIfNotNull(objEntity, "description", tObject.get("description"));
        addPropertyIfNotNull(objEntity, "keywords", nonNullListOrNull(tObject.get("keywords")));
        addPropertyIfNotNull(objEntity, "subjects", nonNullListOrNull(tObject.get("subjects")));

        objEntity.put("@context", coreContext());
        return objEntity;
    }
}
