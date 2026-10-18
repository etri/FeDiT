package com.federated.ontology.searchRule.neo4j.entity;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.Version;
import org.springframework.data.neo4j.core.schema.Id;
import org.springframework.data.neo4j.core.schema.Node;

@Getter
@Setter
@NoArgsConstructor
@Node("Sensor")
public class SensorNode {

    @Id
    private String sensorId;

    @Version
    private Long version;

    public SensorNode(String sensorId) {
        this.sensorId = sensorId;
    }
}
