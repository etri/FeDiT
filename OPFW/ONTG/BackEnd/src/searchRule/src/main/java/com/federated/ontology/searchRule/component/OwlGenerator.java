package com.federated.ontology.searchRule.component;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.jena.ontology.*;
import org.apache.jena.rdf.model.ModelFactory;
import org.apache.jena.vocabulary.OWL;
import org.apache.jena.vocabulary.RDF;
import org.apache.jena.vocabulary.RDFS;
import org.apache.jena.vocabulary.XSD;
import org.springframework.stereotype.Component;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;

@Component
public class OwlGenerator {

    private static final String BASE = "http://example.com/fdt#";
    private static final String ONTOLOGY_URI = "http://example.com/fdt";

    private final ObjectMapper objectMapper = new ObjectMapper();

    public void generate(String jsonString, File outputFile) {
        try {
            JsonNode root = objectMapper.readTree(jsonString);

            OntModel ontModel = ModelFactory.createOntologyModel(OntModelSpec.OWL_DL_MEM);

            ontModel.setNsPrefix("fdt", BASE);
            ontModel.setNsPrefix("owl", OWL.NS);
            ontModel.setNsPrefix("rdf", RDF.uri);
            ontModel.setNsPrefix("rdfs", RDFS.uri);
            ontModel.setNsPrefix("xsd", XSD.NS);

            Ontology ontology = ontModel.createOntology(ONTOLOGY_URI);
            ontology.addComment("Auto-generated ontology from NGSI-LD entities", "en");

            Iterator<String> typeNames = root.fieldNames();
            while (typeNames.hasNext()) {
                String typeName = typeNames.next();
                JsonNode entitiesNode = root.get(typeName);

                if (entitiesNode == null || entitiesNode.isNull()) {
                    continue;
                }

                OntClass typeClass = getOrCreateClass(ontModel, typeName);

                List<JsonNode> entities = new ArrayList<>();
                if (entitiesNode.isArray()) {
                    entitiesNode.forEach(entities::add);
                } else if (entitiesNode.isObject()) {
                    entities.add(entitiesNode);
                } else {
                    continue;
                }

                for (JsonNode entityNode : entities) {
                    processEntityNode(ontModel, typeClass, entityNode);
                }
            }

            File parent = outputFile.getParentFile();
            if (parent != null && !parent.exists()) {
                parent.mkdirs();
            }

            try (FileOutputStream out = new FileOutputStream(outputFile)) {
                ontModel.write(out, "TURTLE");
            }

            System.out.println("OWL 생성 완료 → " + outputFile.getAbsolutePath());

        } catch (IOException e) {
            throw new RuntimeException("JSON 파싱 실패", e);
        } catch (Exception e) {
            throw new RuntimeException("OWL 생성 중 오류", e);
        }
    }

    private void processEntityNode(OntModel ontModel, OntClass typeClass, JsonNode entityNode) {
        String id = getTextOrNull(entityNode.get("id"));
        String typeInEntity = getTextOrNull(entityNode.get("type"));

        if (id == null) {
            return;
        }

        String normalizedId = normalize(id);
        Individual indiv = ontModel.createIndividual(BASE + normalizedId, typeClass);

        Iterator<String> fields = entityNode.fieldNames();
        while (fields.hasNext()) {
            String fieldName = fields.next();

            if ("id".equals(fieldName) || "type".equals(fieldName) || "@context".equals(fieldName)) {
                continue;
            }

            JsonNode valueNode = entityNode.get(fieldName);

            if (valueNode.isObject() && valueNode.has("type")) {
                String ngsiType = valueNode.get("type").asText();

                if ("Property".equalsIgnoreCase(ngsiType)) {
                    handleProperty(ontModel, typeClass, indiv, fieldName, valueNode);
                } else if ("Relationship".equalsIgnoreCase(ngsiType)) {
                    handleRelationship(ontModel, typeClass, indiv, fieldName, valueNode);
                } else {
                }
            }
            else {
                handleSimpleValue(ontModel, typeClass, indiv, fieldName, valueNode);
            }
        }
    }

    private void handleProperty(OntModel ontModel,
                                OntClass domainClass,
                                Individual indiv,
                                String fieldName,
                                JsonNode propertyNode) {

        JsonNode valueNode = propertyNode.get("value");
        if (valueNode == null || valueNode.isNull()) {
            return;
        }

        DatatypeProperty dp = getOrCreateDatatypeProperty(ontModel, fieldName);
        dp.addDomain(domainClass);
        dp.addRange(XSD.xstring);

        if (valueNode.isArray()) {
            for (JsonNode v : valueNode) {
                indiv.addProperty(dp, v.asText());
            }
        } else {
            indiv.addProperty(dp, valueNode.asText());
        }
    }

    private void handleRelationship(OntModel ontModel,
                                    OntClass domainClass,
                                    Individual indiv,
                                    String fieldName,
                                    JsonNode relationshipNode) {

        JsonNode objNode = relationshipNode.get("object");
        if (objNode == null || objNode.isNull()) {
            return;
        }

        ObjectProperty op = getOrCreateObjectProperty(ontModel, fieldName);
        op.addDomain(domainClass);

        if (objNode.isArray()) {
            for (JsonNode objIdNode : objNode) {
                if (!objIdNode.isTextual()) {
                    continue;
                }
                String targetId = objIdNode.asText();
                if (targetId == null || targetId.isEmpty()) {
                    continue;
                }
                Individual target = getOrCreateIndividual(ontModel, targetId, null);
                indiv.addProperty(op, target);
            }
        }
        else if (objNode.isTextual()) {
            String targetId = objNode.asText();
            if (targetId == null || targetId.isEmpty()) {
                return;
            }
            Individual target = getOrCreateIndividual(ontModel, targetId, null);
            indiv.addProperty(op, target);
        }
    }

    private void handleSimpleValue(OntModel ontModel,
                                   OntClass domainClass,
                                   Individual indiv,
                                   String fieldName,
                                   JsonNode valueNode) {

        DatatypeProperty dp = getOrCreateDatatypeProperty(ontModel, fieldName);
        dp.addDomain(domainClass);
        dp.addRange(XSD.xstring);

        if (valueNode.isArray()) {
            for (JsonNode v : valueNode) {
                indiv.addProperty(dp, v.asText());
            }
        } else if (valueNode.isTextual() || valueNode.isNumber() || valueNode.isBoolean()) {
            indiv.addProperty(dp, valueNode.asText());
        }
    }

    private OntClass getOrCreateClass(OntModel model, String localName) {
        String uri = BASE + localName;
        OntClass cls = model.getOntClass(uri);
        if (cls == null) {
            cls = model.createClass(uri);
        }
        return cls;
    }

    private DatatypeProperty getOrCreateDatatypeProperty(OntModel model, String localName) {
        String uri = BASE + localName;
        DatatypeProperty dp = model.getDatatypeProperty(uri);
        if (dp == null) {
            dp = model.createDatatypeProperty(uri);
        }
        return dp;
    }

    private ObjectProperty getOrCreateObjectProperty(OntModel model, String localName) {
        String uri = BASE + localName;
        ObjectProperty op = model.getObjectProperty(uri);
        if (op == null) {
            op = model.createObjectProperty(uri);
        }
        return op;
    }

    private Individual getOrCreateIndividual(OntModel model, String id, OntClass cls) {
        String normalizedId = normalize(id);
        String uri = BASE + normalizedId;
        Individual indiv = model.getIndividual(uri);
        if (indiv == null) {
            if (cls != null) {
                indiv = model.createIndividual(uri, cls);
            } else {
                indiv = model.createIndividual(uri, (OntClass) null);
            }
        }
        return indiv;
    }

    private String getTextOrNull(JsonNode node) {
        return (node != null && !node.isNull()) ? node.asText() : null;
    }

    private String normalize(String id) {
        return id.replace("urn:ngsi-ld:", "")
                .replace(":", "-")
                .replaceAll("[^a-zA-Z0-9-_]", "");
    }
}
