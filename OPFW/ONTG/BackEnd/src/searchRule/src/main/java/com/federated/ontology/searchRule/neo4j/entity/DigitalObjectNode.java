package com.federated.ontology.searchRule.neo4j.entity;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.Version;
import org.springframework.data.neo4j.core.schema.Id;
import org.springframework.data.neo4j.core.schema.Node;
import org.springframework.data.neo4j.core.schema.Relationship;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@Node("DigitalObject")
public class DigitalObjectNode {

    @Id
    private String objectId;

    @Version
    private Long version;

    private String name;
    private String description;
    private List<String> keywords;
    private List<String> subjects;
    private List<String> twinKeywords;
    private List<String> twinSubjects;

    @Relationship(type = "IS_DIGITAL_OBJECT_OF", direction = Relationship.Direction.OUTGOING)
    private DigitalTwinNode parentTwin;

    @Relationship(type = "HAS_SUBJECT_TERM", direction = Relationship.Direction.OUTGOING)
    private List<SubjectTermNode> subjectTerms = new ArrayList<>();

    @Relationship(type = "HAS_KEYWORD_TERM", direction = Relationship.Direction.OUTGOING)
    private List<KeywordTermNode> keywordTerms = new ArrayList<>();

    @Relationship(type = "HAS_NAME_TERM", direction = Relationship.Direction.OUTGOING)
    private ObjectNameTermNode nameTerm;

    public DigitalObjectNode(String objectId) {
        this.objectId = objectId;
    }
}
