package com.federated.ontology.searchRule.dev.neo4jSync.cypher;

import com.federated.ontology.searchRule.dev.neo4jSync.Neo4jSyncFailureLogger;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.data.neo4j.core.Neo4jClient;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.concurrent.ExecutorService;

@Slf4j
@Component("cypherNeo4jSyncExecutor")
public class CypherNeo4jSyncExecutor {

    private final ExecutorService[] partitionedExecutors;
    private final Neo4jClient neo4jClient;
    private final Neo4jSyncFailureLogger failureLogger;

    public CypherNeo4jSyncExecutor(
            @Qualifier("neo4jSyncPartitionedExecutors") ExecutorService[] partitionedExecutors,
            Neo4jClient neo4jClient,
            Neo4jSyncFailureLogger failureLogger) {
        this.partitionedExecutors = partitionedExecutors;
        this.neo4jClient = neo4jClient;
        this.failureLogger = failureLogger;
    }

    public void submitSyncTask(Map<String, Object> ngsiLdEntity) {
        CypherNeo4jSyncTask task = new CypherNeo4jSyncTask(
                neo4jClient, failureLogger, ngsiLdEntity);
        partitionedExecutors[0].submit(task);
        log.info("[Cypher] Sync task submitted. id={}", ngsiLdEntity.get("id"));
    }
}
