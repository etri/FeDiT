package com.federated.ontology.searchRule.dto.kafkaDto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.databind.JsonNode;

import java.util.List;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@JsonIgnoreProperties(ignoreUnknown = true)
public class DigitalTwinMetaInfo {
    private JsonNode metadata;
    private String action;
    private List<Object> upSetList;
    private String key;
}
