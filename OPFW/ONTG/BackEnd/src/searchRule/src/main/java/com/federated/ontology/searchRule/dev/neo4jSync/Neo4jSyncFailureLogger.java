package com.federated.ontology.searchRule.dev.neo4jSync;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.Map;

@Slf4j(topic = "NEO4J_SYNC_FAIL")
@Component
public class Neo4jSyncFailureLogger {

    public void logFailure(String entityType, String entityId,
                           Map<String, Object> originalData, Exception error) {
        log.error("═══ Neo4j Sync Failure ═══");
        log.error("  entityType : {}", entityType);
        log.error("  entityId   : {}", entityId);
        log.error("  data       : {}", originalData);
        log.error("  error      : {}", error.getMessage(), error);
    }
}
