package kr.co.n2m.platform.meta.rdf.neo4j.domain;

import java.util.Set;

import org.neo4j.driver.types.Node;
import org.neo4j.driver.types.Relationship;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.Setter;

/**
 * GraphResult는 Cypher에서 긁어온 Node/Relationship 들을 담는 DTO.
 * - 중복 제거된 Node set
 * - 중복 제거된 Rel set
 * 
 * @author  n2m
 */
@Schema(description="NEO4J 결과 그래프 Dto")
@Getter
@Setter
public  class Neo4jGraphResultDto {
    Set<Node> nodes;
    Set<Relationship> relationships;
    
    public Neo4jGraphResultDto() {}

    public Neo4jGraphResultDto(Set<Node> nodes, Set<Relationship> relationships) {
        this.nodes = nodes;
        this.relationships = relationships;
    }
}
