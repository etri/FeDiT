package com.federated.ontology.searchRule.neo4j.repository;

import com.federated.ontology.searchRule.neo4j.entity.DigitalTwinNode;
import org.springframework.data.neo4j.repository.Neo4jRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DigitalTwinNeo4jRepository extends Neo4jRepository<DigitalTwinNode, String> {
}
