package com.federated.ontology.searchRule.websocket.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ResponseStatus {
    private String status;
    private String message;
}