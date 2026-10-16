package com.federated.ontology.searchRule.dev.neo4jSync;

import com.federated.ontology.searchRule.neo4j.Neo4jRepositoryHolder;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.concurrent.ExecutorService;

@Slf4j
@Component
public class Neo4jGraphSyncExecutor {

    private final ExecutorService[] partitionedExecutors;
    private final Neo4jRepositoryHolder repositoryHolder;
    private final Neo4jSyncFailureLogger failureLogger;

    public Neo4jGraphSyncExecutor(
            @Qualifier("neo4jSyncPartitionedExecutors") ExecutorService[] partitionedExecutors,
            Neo4jRepositoryHolder repositoryHolder,
            Neo4jSyncFailureLogger failureLogger) {
        this.partitionedExecutors = partitionedExecutors;
        this.repositoryHolder = repositoryHolder;
        this.failureLogger = failureLogger;
    }

    public void submitSyncTask(Map<String, Object> metadata, String action, String entityType) {
        String routingKey = resolveRoutingKey(metadata, entityType);
        int partition = Math.abs(routingKey.hashCode()) % partitionedExecutors.length;

        Neo4jSyncTask task = new Neo4jSyncTask(
                repositoryHolder, failureLogger,
                metadata, action, entityType
        );
        partitionedExecutors[partition].submit(task);

        String id = String.valueOf(metadata.getOrDefault("dtid", metadata.get("objectId")));
        log.info("[Neo4jSync] 태스크 제출. partition={}, entityType={}, action={}, id={}, routingKey={}",
                partition, entityType, action, id, routingKey);
    }

    public void submitSyncTask(Map<String, Object> metadata, String action) {
        submitSyncTask(metadata, action, "DigitalTwin");
    }

    private String resolveRoutingKey(Map<String, Object> metadata, String entityType) {
        if ("DigitalObject".equals(entityType)) {
            Object parentTwinId = metadata.get("parentTwinId");
            if (parentTwinId != null) return parentTwinId.toString();
        }
        Object dtid = metadata.get("dtid");
        if (dtid != null) return dtid.toString();
        return String.valueOf(metadata.getOrDefault("objectId", "unknown"));
    }
}
