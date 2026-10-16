package com.federated.ontology.searchRule.websocket.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChatHistory<T> {
    private T content;
    private String sender;
    private Long timestamp = System.currentTimeMillis();
}