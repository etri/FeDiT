package com.federated.ontology.searchRule.neo4j.repository;

import com.federated.ontology.searchRule.neo4j.entity.SubjectTermNode;
import org.springframework.data.neo4j.repository.Neo4jRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SubjectTermNeo4jRepository extends Neo4jRepository<SubjectTermNode, String> {
}
