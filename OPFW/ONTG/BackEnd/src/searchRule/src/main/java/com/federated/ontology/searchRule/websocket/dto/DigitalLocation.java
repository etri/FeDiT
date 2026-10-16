package com.federated.ontology.searchRule.websocket.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DigitalLocation {
    private String type;
    private double[][] coordinates;
}
