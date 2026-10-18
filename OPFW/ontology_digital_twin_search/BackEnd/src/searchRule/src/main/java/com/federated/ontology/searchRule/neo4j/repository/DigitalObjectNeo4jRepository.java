package com.federated.ontology.searchRule.neo4j.repository;

import com.federated.ontology.searchRule.neo4j.entity.DigitalObjectNode;
import org.springframework.data.neo4j.repository.Neo4jRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DigitalObjectNeo4jRepository extends Neo4jRepository<DigitalObjectNode, String> {
}
