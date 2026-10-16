package com.federated.ontology.searchRule.neo4j;

import com.federated.ontology.searchRule.neo4j.repository.*;
import lombok.Getter;
import org.springframework.stereotype.Component;

@Getter
@Component
public class Neo4jRepositoryHolder {

    private final DigitalTwinNeo4jRepository twinRepository;
    private final DigitalObjectNeo4jRepository objectRepository;
    private final SensorNeo4jRepository sensorRepository;
    private final SubjectTermNeo4jRepository subjectTermRepository;
    private final KeywordTermNeo4jRepository keywordTermRepository;
    private final ObjectNameTermNeo4jRepository objectNameTermRepository;

    public Neo4jRepositoryHolder(DigitalTwinNeo4jRepository twinRepository,
                                 DigitalObjectNeo4jRepository objectRepository,
                                 SensorNeo4jRepository sensorRepository,
                                 SubjectTermNeo4jRepository subjectTermRepository,
                                 KeywordTermNeo4jRepository keywordTermRepository,
                                 ObjectNameTermNeo4jRepository objectNameTermRepository) {
        this.twinRepository = twinRepository;
        this.objectRepository = objectRepository;
        this.sensorRepository = sensorRepository;
        this.subjectTermRepository = subjectTermRepository;
        this.keywordTermRepository = keywordTermRepository;
        this.objectNameTermRepository = objectNameTermRepository;
    }
}
