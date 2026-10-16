package com.federated.ontology.searchRule.dev.neo4jSync.ogm;

import com.federated.ontology.searchRule.dev.neo4jSync.Neo4jSyncFailureLogger;
import com.federated.ontology.searchRule.neo4j.repository.DigitalTwinNeo4jRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.concurrent.ExecutorService;

@Slf4j
@Component("ogmNeo4jSyncExecutor")
public class OgmNeo4jSyncExecutor {

    private final ExecutorService[] partitionedExecutors;
    private final DigitalTwinNeo4jRepository twinRepository;
    private final Neo4jSyncFailureLogger failureLogger;

    public OgmNeo4jSyncExecutor(
            @Qualifier("neo4jSyncPartitionedExecutors") ExecutorService[] partitionedExecutors,
            DigitalTwinNeo4jRepository twinRepository,
            Neo4jSyncFailureLogger failureLogger) {
        this.partitionedExecutors = partitionedExecutors;
        this.twinRepository = twinRepository;
        this.failureLogger = failureLogger;
    }

    public void submitSyncTask(Map<String, Object> ngsiLdEntity) {
        OgmNeo4jSyncTask task = new OgmNeo4jSyncTask(
                twinRepository, failureLogger, ngsiLdEntity);
        partitionedExecutors[0].submit(task);
        log.info("[OGM] Sync task submitted. id={}", ngsiLdEntity.get("id"));
    }
}
