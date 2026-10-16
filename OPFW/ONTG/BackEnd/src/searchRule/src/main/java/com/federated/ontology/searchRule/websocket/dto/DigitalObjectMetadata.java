package com.federated.ontology.searchRule.websocket.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DigitalObjectMetadata {
    private String id;
    private String name;
    private String description;
}
