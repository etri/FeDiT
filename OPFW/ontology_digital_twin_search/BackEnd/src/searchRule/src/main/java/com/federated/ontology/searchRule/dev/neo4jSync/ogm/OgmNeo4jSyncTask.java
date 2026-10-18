package com.federated.ontology.searchRule.dev.neo4jSync.ogm;

import com.federated.ontology.searchRule.dev.neo4jSync.Neo4jSyncFailureLogger;
import com.federated.ontology.searchRule.neo4j.sync.NgsiLdPropertyExtractor;
import com.federated.ontology.searchRule.neo4j.entity.DigitalTwinNode;
import com.federated.ontology.searchRule.neo4j.repository.DigitalTwinNeo4jRepository;
import lombok.extern.slf4j.Slf4j;

import java.util.List;
import java.util.Map;

@Slf4j
public class OgmNeo4jSyncTask implements Runnable {

    private final DigitalTwinNeo4jRepository repository;
    private final Neo4jSyncFailureLogger failureLogger;
    private final Map<String, Object> ngsiLdEntity;

    public OgmNeo4jSyncTask(DigitalTwinNeo4jRepository repository,
                            Neo4jSyncFailureLogger failureLogger,
                            Map<String, Object> ngsiLdEntity) {
        this.repository = repository;
        this.failureLogger = failureLogger;
        this.ngsiLdEntity = ngsiLdEntity;
    }

    @Override
    public void run() {
        String entityId = NgsiLdPropertyExtractor.extractId(ngsiLdEntity);
        String entityType = NgsiLdPropertyExtractor.extractType(ngsiLdEntity);

        try {
            Map<String, Object> props = NgsiLdPropertyExtractor.extractProperties(ngsiLdEntity);

            DigitalTwinNode node = repository.findById(entityId)
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

            repository.save(node);

            log.info("[OGM] Neo4j 저장 완료. type={}, id={}", entityType, entityId);

        } catch (Exception e) {
            failureLogger.logFailure(entityType, entityId, ngsiLdEntity, e);
        }
    }
}
