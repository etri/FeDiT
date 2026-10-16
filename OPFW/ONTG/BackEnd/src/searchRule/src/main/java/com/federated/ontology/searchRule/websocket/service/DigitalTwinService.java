package com.federated.ontology.searchRule.websocket.service;

import org.springframework.stereotype.Service;

@Service
public class DigitalTwinService {

    public boolean checkStatus() {
        try {
            return true;
        } catch (Exception e) {
            return false;
        }
    }
}