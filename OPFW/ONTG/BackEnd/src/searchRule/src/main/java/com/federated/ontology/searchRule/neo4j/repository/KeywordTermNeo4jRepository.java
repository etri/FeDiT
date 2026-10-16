package com.federated.ontology.searchRule.neo4j.repository;

import com.federated.ontology.searchRule.neo4j.entity.KeywordTermNode;
import org.springframework.data.neo4j.repository.Neo4jRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface KeywordTermNeo4jRepository extends Neo4jRepository<KeywordTermNode, String> {
}
