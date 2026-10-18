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
@Node("DigitalTwin")
public class DigitalTwinNode {

    @Id
    private String dtid;

    @Version
    private Long version;

    private String name;
    private String description;
    private String owner;
    private String contactPoint;
    private String creator;
    private String creationTime;
    private String countryCode;
    private String classificationTypeCode;
    private String classificationCode;
    private String metaModel;
    private String metaTypeModel;
    private String pointOfAccess;
    private String type;
    private List<String> subjects;
    private List<String> keywords;

    @Relationship(type = "HAS_DIGITAL_TWIN_OBJECT", direction = Relationship.Direction.OUTGOING)
    private List<DigitalTwinNode> digitalTwinObjects = new ArrayList<>();

    @Relationship(type = "HAS_SENSOR", direction = Relationship.Direction.OUTGOING)
    private List<SensorNode> sensors = new ArrayList<>();

    @Relationship(type = "HAS_SUBJECT_TERM", direction = Relationship.Direction.OUTGOING)
    private List<SubjectTermNode> subjectTerms = new ArrayList<>();

    @Relationship(type = "HAS_KEYWORD_TERM", direction = Relationship.Direction.OUTGOING)
    private List<KeywordTermNode> keywordTerms = new ArrayList<>();

    public DigitalTwinNode(String dtid) {
        this.dtid = dtid;
    }
}
