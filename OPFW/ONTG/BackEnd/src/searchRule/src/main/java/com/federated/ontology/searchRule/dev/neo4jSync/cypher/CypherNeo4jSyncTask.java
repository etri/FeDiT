package com.federated.ontology.searchRule.dev.neo4jSync.cypher;

import com.federated.ontology.searchRule.dev.neo4jSync.Neo4jSyncFailureLogger;
import com.federated.ontology.searchRule.neo4j.sync.NgsiLdPropertyExtractor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.neo4j.core.Neo4jClient;

import java.util.List;
import java.util.Map;

@Slf4j
public class CypherNeo4jSyncTask implements Runnable {

    private final Neo4jClient neo4jClient;
    private final Neo4jSyncFailureLogger failureLogger;
    private final Map<String, Object> ngsiLdEntity;

    public CypherNeo4jSyncTask(Neo4jClient neo4jClient,
                               Neo4jSyncFailureLogger failureLogger,
                               Map<String, Object> ngsiLdEntity) {
        this.neo4jClient = neo4jClient;
        this.failureLogger = failureLogger;
        this.ngsiLdEntity = ngsiLdEntity;
    }

    @Override
    public void run() {
        String entityId = NgsiLdPropertyExtractor.extractId(ngsiLdEntity);
        String entityType = NgsiLdPropertyExtractor.extractType(ngsiLdEntity);

        try {
            Map<String, Object> props = NgsiLdPropertyExtractor.extractProperties(ngsiLdEntity);
            Map<String, Object> rels = NgsiLdPropertyExtractor.extractRelationships(ngsiLdEntity);

            neo4jClient.query(
                    "MERGE (n:" + entityType + " {id: $id}) " +
                    "ON CREATE SET n += $props " +
                    "ON MATCH SET n += $props"
            )
            .bind(entityId).to("id")
            .bind(props).to("props")
            .run();

            for (Map.Entry<String, Object> rel : rels.entrySet()) {
                String relType = rel.getKey();
                Object target = rel.getValue();

                if (target instanceof String targetId) {
                    mergeRelationship(entityId, entityType, relType, targetId);
                } else if (target instanceof List<?> targetIds) {
                    for (Object tid : targetIds) {
                        if (tid instanceof String targetId) {
                            mergeRelationship(entityId, entityType, relType, targetId);
                        }
                    }
                }
            }

            log.info("[Cypher] Neo4j 저장 완료. type={}, id={}", entityType, entityId);

        } catch (Exception e) {
            failureLogger.logFailure(entityType, entityId, ngsiLdEntity, e);
        }
    }

    private void mergeRelationship(String sourceId, String sourceType,
                                   String relType, String targetId) {
        String targetType = extractTypeFromUrn(targetId);
        if (targetType == null) {
            log.warn("Cannot extract type from URN: {}", targetId);
            return;
        }

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
