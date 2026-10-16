package com.federated.ontology.searchRule.websocket.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DigitalTwin {
    private String digitalTwinID;
    private String digitalTwinName;
    private String description;
    private String owner;
    private String[] keywords;
    private OffsetDateTime creationTime;
    private String creatorID;
    private OffsetDateTime modificationTime;
    private String pointOfAccess;
    private String contactPoint;
    private String[] subjects;
    private DigitalLocation location;
    private String[] memberDigitalObjectsIDS;
    private long numberOfDigitalObjects;
    private long numberOfServices;
    private long numberOfSimulations;
}
