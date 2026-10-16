package com.federated.ontology.searchRule.dev.controller.prototype;

import com.federated.ontology.searchRule.neo4j.sync.NgsiLdPropertyExtractor;
import com.federated.ontology.searchRule.dev.neo4jSync.cypher.CypherNeo4jSyncExecutor;
import com.federated.ontology.searchRule.dev.neo4jSync.ogm.OgmNeo4jSyncExecutor;
import com.federated.ontology.searchRule.neo4j.entity.DigitalObjectNode;
import com.federated.ontology.searchRule.neo4j.entity.DigitalTwinNode;
import com.federated.ontology.searchRule.neo4j.repository.DigitalObjectNeo4jRepository;
import com.federated.ontology.searchRule.neo4j.repository.DigitalTwinNeo4jRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.data.neo4j.core.Neo4jClient;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import org.springframework.context.annotation.Profile;

import java.util.*;

@Slf4j
@RestController
@RequestMapping("/api/v1/dev/neo4j-sync")
@Profile("dev")
public class PrototypeTestController {

    private static final Set<String> ALLOWED_NEO4J_TYPES = Set.of(
            "DigitalTwin", "DigitalObject", "OntologyTerm",
            "SubjectTerm", "KeywordTerm", "ObjectNameTerm", "Sensor"
    );

    private static void validateNodeType(String type) {
        if (!ALLOWED_NEO4J_TYPES.contains(type)) {
            throw new IllegalArgumentException("허용되지 않은 엔티티 타입: " + type);
        }
    }

    private final OgmNeo4jSyncExecutor ogmExecutor;
    private final CypherNeo4jSyncExecutor cypherExecutor;
    private final DigitalTwinNeo4jRepository twinRepository;
    private final DigitalObjectNeo4jRepository objectRepository;
    private final Neo4jClient neo4jClient;

    public PrototypeTestController(
            @Qualifier("ogmNeo4jSyncExecutor") OgmNeo4jSyncExecutor ogmExecutor,
            @Qualifier("cypherNeo4jSyncExecutor") CypherNeo4jSyncExecutor cypherExecutor,
            DigitalTwinNeo4jRepository twinRepository,
            DigitalObjectNeo4jRepository objectRepository,
            Neo4jClient neo4jClient) {
        this.ogmExecutor = ogmExecutor;
        this.cypherExecutor = cypherExecutor;
        this.twinRepository = twinRepository;
        this.objectRepository = objectRepository;
        this.neo4jClient = neo4jClient;
    }

    @PostMapping("/ogm/syncs")
    public ResponseEntity<?> ogmSync(@RequestBody Map<String, Object> ngsiLdEntity,
                                     @RequestParam(value = "blocking", required = false, defaultValue = "false") boolean blocking) {
        if (blocking) {
            return ogmSyncBlocking(ngsiLdEntity);
        }
        ogmExecutor.submitSyncTask(ngsiLdEntity);
        return ResponseEntity.accepted().body(Map.of(
                "method", "OGM",
                "status", "SUBMITTED",
                "id", String.valueOf(ngsiLdEntity.get("id"))
        ));
    }

    private ResponseEntity<Map<String, Object>> ogmSyncBlocking(Map<String, Object> ngsiLdEntity) {
        try {
            Map<String, Object> props = NgsiLdPropertyExtractor.extractProperties(ngsiLdEntity);
            String entityId = NgsiLdPropertyExtractor.extractId(ngsiLdEntity);

            DigitalTwinNode node = twinRepository.findById(entityId)
                    .orElse(new DigitalTwinNode(entityId));

            node.setName((String) props.get("name"));
            node.setDescription((String) props.get("description"));
            node.setOwner((String) props.get("owner"));

            if (props.get("keywords") instanceof List<?> kw) {
                @SuppressWarnings("unchecked")
                List<String> keywords = (List<String>) kw;
                node.setKeywords(keywords);
            }
            if (props.get("subjects") instanceof List<?> sb) {
                @SuppressWarnings("unchecked")
                List<String> subjects = (List<String>) sb;
                node.setSubjects(subjects);
            }

            DigitalTwinNode saved = twinRepository.save(node);

            return ResponseEntity.ok(Map.of(
                    "method", "OGM",
                    "status", "SUCCESS",
                    "savedId", saved.getDtid(),
                    "savedName", Objects.toString(saved.getName(), "null")
            ));
        } catch (Exception e) {
            log.error("[OGM] 동기 저장 실패", e);
            return ResponseEntity.internalServerError().body(Map.of(
                    "method", "OGM",
                    "status", "FAIL",
                    "error", e.getMessage()
            ));
        }
    }

    @GetMapping("/ogm/twins/{id}")
    public ResponseEntity<?> ogmGetTwin(@PathVariable String id) {
        String fullId = id.startsWith("urn:") ? id : "urn:ngsi-ld:DigitalTwin:" + id;
        return twinRepository.findById(fullId)
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/ogm/twins")
    public ResponseEntity<List<DigitalTwinNode>> ogmGetAllTwins() {
        return ResponseEntity.ok(twinRepository.findAll());
    }

    @DeleteMapping("/ogm/twins/{id}")
    public ResponseEntity<Map<String, String>> ogmDeleteTwin(@PathVariable String id) {
        String fullId = id.startsWith("urn:") ? id : "urn:ngsi-ld:DigitalTwin:" + id;
        if (twinRepository.existsById(fullId)) {
            twinRepository.deleteById(fullId);
            return ResponseEntity.ok(Map.of("method", "OGM", "status", "DELETED", "id", fullId));
        }
        return ResponseEntity.notFound().build();
    }

    @PostMapping("/cypher/syncs")
    public ResponseEntity<?> cypherSync(@RequestBody Map<String, Object> ngsiLdEntity,
                                        @RequestParam(value = "blocking", required = false, defaultValue = "false") boolean blocking) {
        if (blocking) {
            return cypherSyncBlocking(ngsiLdEntity);
        }
        cypherExecutor.submitSyncTask(ngsiLdEntity);
        return ResponseEntity.accepted().body(Map.of(
                "method", "Cypher",
                "status", "SUBMITTED",
                "id", String.valueOf(ngsiLdEntity.get("id"))
        ));
    }

    private ResponseEntity<Map<String, Object>> cypherSyncBlocking(Map<String, Object> ngsiLdEntity) {
        try {
            String entityId = NgsiLdPropertyExtractor.extractId(ngsiLdEntity);
            String entityType = NgsiLdPropertyExtractor.extractType(ngsiLdEntity);
            Map<String, Object> props = NgsiLdPropertyExtractor.extractProperties(ngsiLdEntity);
            Map<String, Object> rels = NgsiLdPropertyExtractor.extractRelationships(ngsiLdEntity);

            validateNodeType(entityType);
            neo4jClient.query(
                    "MERGE (n:" + entityType + " {id: $id}) " +
                    "ON CREATE SET n += $props " +
                    "ON MATCH SET n += $props"
            )
            .bind(entityId).to("id")
            .bind(props).to("props")
            .run();

            int relCount = 0;
            for (Map.Entry<String, Object> rel : rels.entrySet()) {
                String relType = rel.getKey();
                Object target = rel.getValue();

                if (target instanceof String targetId) {
                    mergeRelationship(entityId, entityType, relType, targetId);
                    relCount++;
                } else if (target instanceof List<?> targetIds) {
                    for (Object tid : targetIds) {
                        if (tid instanceof String targetId) {
                            mergeRelationship(entityId, entityType, relType, targetId);
                            relCount++;
                        }
                    }
                }
            }

            return ResponseEntity.ok(Map.of(
                    "method", "Cypher",
                    "status", "SUCCESS",
                    "entityId", entityId,
                    "entityType", entityType,
                    "propertiesCount", props.size(),
                    "relationshipsCreated", relCount
            ));
        } catch (Exception e) {
            log.error("[Cypher] 동기 저장 실패", e);
            return ResponseEntity.internalServerError().body(Map.of(
                    "method", "Cypher",
                    "status", "FAIL",
                    "error", e.getMessage()
            ));
        }
    }

    @GetMapping("/cypher/nodes/{type}/{shortId}")
    public ResponseEntity<?> cypherGetNode(@PathVariable String type, @PathVariable String shortId) {
        validateNodeType(type);
        String fullId = "urn:ngsi-ld:" + type + ":" + shortId;

        Collection<Map<String, Object>> results = neo4jClient.query(
                "MATCH (n:" + type + " {id: $id}) RETURN properties(n) AS props"
        )
        .bind(fullId).to("id")
        .fetch().all();

        if (results.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(results.iterator().next().get("props"));
    }

    @GetMapping("/cypher/nodes/{type}")
    public ResponseEntity<?> cypherGetAllNodes(@PathVariable String type) {
        validateNodeType(type);
        Collection<Map<String, Object>> results = neo4jClient.query(
                "MATCH (n:" + type + ") RETURN properties(n) AS props"
        )
        .fetch().all();

        return ResponseEntity.ok(results);
    }

    @DeleteMapping("/cypher/nodes/{type}/{shortId}")
    public ResponseEntity<Map<String, String>> cypherDeleteNode(
            @PathVariable String type, @PathVariable String shortId) {
        validateNodeType(type);
        String fullId = "urn:ngsi-ld:" + type + ":" + shortId;

        neo4jClient.query(
                "MATCH (n:" + type + " {id: $id}) DETACH DELETE n"
        )
        .bind(fullId).to("id")
        .run();

        return ResponseEntity.ok(Map.of(
                "method", "Cypher",
                "status", "DELETED",
                "id", fullId
        ));
    }

    @GetMapping("/cypher/nodes/{type}/{shortId}/relationships")
    public ResponseEntity<?> cypherGetRelationships(
            @PathVariable String type, @PathVariable String shortId) {
        validateNodeType(type);
        String fullId = "urn:ngsi-ld:" + type + ":" + shortId;

        Collection<Map<String, Object>> results = neo4jClient.query(
                "MATCH (a:" + type + " {id: $id})-[r]->(b) " +
                "RETURN type(r) AS relType, b.id AS targetId, head(labels(b)) AS targetType"
        )
        .bind(fullId).to("id")
        .fetch().all();

        return ResponseEntity.ok(results);
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> healthCheck() {
        try {
            Collection<Map<String, Object>> result = neo4jClient.query(
                    "RETURN 'Neo4j Connected!' AS message, timestamp() AS ts"
            ).fetch().all();

            Map<String, Object> response = new LinkedHashMap<>();
            response.put("status", "OK");
            response.put("neo4j", result.iterator().next());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of(
                    "status", "FAIL",
                    "error", e.getMessage()
            ));
        }
    }

    @GetMapping("/stats")
    public ResponseEntity<?> stats() {
        Collection<Map<String, Object>> results = neo4jClient.query("""
                CALL {
                    MATCH (n) RETURN count(n) AS nodeCount
                }
                CALL {
                    MATCH ()-[r]->() RETURN count(r) AS relCount
                }
                RETURN nodeCount, relCount
                """).fetch().all();

        return ResponseEntity.ok(results.iterator().next());
    }

    @DeleteMapping("/entities")
    public ResponseEntity<Map<String, String>> clearAll() {
        neo4jClient.query("MATCH (n) DETACH DELETE n").run();
        return ResponseEntity.ok(Map.of("status", "ALL_CLEARED"));
    }

    @GetMapping("/graph")
    public ResponseEntity<Map<String, Object>> getGraph() {
        Collection<Map<String, Object>> nodes = neo4jClient.query("""
                MATCH (n)
                RETURN n.id AS id,
                       coalesce(n.name, n.label, n.id) AS label,
                       head(labels(n)) AS type
                """).fetch().all();

        Collection<Map<String, Object>> edges = neo4jClient.query("""
                MATCH (a)-[r]->(b)
                RETURN a.id AS source,
                       b.id AS target,
                       type(r) AS relType
                """).fetch().all();

        Map<String, Object> graph = new LinkedHashMap<>();
        graph.put("nodes", nodes);
        graph.put("edges", edges);
        return ResponseEntity.ok(graph);
    }

    private void mergeRelationship(String sourceId, String sourceType,
                                   String relType, String targetId) {
        String targetType = extractTypeFromUrn(targetId);
        if (targetType == null) return;

        neo4jClient.query(
                "MERGE (a:" + sourceType + " {id: $sourceId}) " +
                "MERGE (b:" + targetType + " {id: $targetId}) " +
                "MERGE (a)-[:" + relType + "]->(b)"
        )
        .bind(sourceId).to("sourceId")
        .bind(targetId).to("targetId")
        .run();
    }

    private String extractTypeFromUrn(String urn) {
        if (urn == null || !urn.startsWith("urn:ngsi-ld:")) return null;
        String[] parts = urn.split(":");
        return parts.length >= 4 ? parts[2] : null;
    }
}
