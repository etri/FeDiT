package com.federated.ontology.searchRule.websocket.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DigitalObject {
    private String digitalTwinID;
    private String digitalObjectID;
    private String digitalObjectName;
    private String description;
    private String[] keywords;
    private OffsetDateTime creationTime;
    private OffsetDateTime modificationTime;
    private String digitalObjectDataAccessType;
    private String digitalObjectDataAccessURL;
    private String digitalObjectControlURL;
    private String digitalObjectDataModel;
    private long digitalObjectDataInterval;
    private String digitalObjectControlRequestModel;
    private DigitalObjectMetadata doMetadata;
    private DigitalLocation preliminaryField;
    private String[] subjects;
    private String digitalObjectDataSourceType;
    private String digitalObjectDataSourceURL;
    private String digitalObjectDataSourceBaseURL;
}
