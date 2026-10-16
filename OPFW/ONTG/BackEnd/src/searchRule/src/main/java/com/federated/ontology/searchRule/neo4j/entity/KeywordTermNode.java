package com.federated.ontology.searchRule.neo4j.entity;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.neo4j.core.schema.Id;
import org.springframework.data.neo4j.core.schema.Node;

@Getter
@Setter
@NoArgsConstructor
@Node("KeywordTerm")
public class KeywordTermNode {

    @Id
    private String id;

    private String label;

    public KeywordTermNode(String id, String label) {
        this.id = id;
        this.label = label;
    }
}
