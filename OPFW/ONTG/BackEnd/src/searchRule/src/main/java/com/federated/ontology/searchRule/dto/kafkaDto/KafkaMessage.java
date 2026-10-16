package com.federated.ontology.searchRule.dto.kafkaDto;

import lombok.Getter;
import lombok.Setter;

import java.util.List;
import java.util.Map;

@Getter
public class KafkaMessage {

    private final String action;
    private final Map<String, Object> metadata;
    private final Map<String, Object> fullMessage;
    private final String key;
    private final String metaTypeModel;
    private final String parentTwinId;
    private final List<Map<String, Object>> upSetList;

    @Setter
    private Long stagedId;

    public KafkaMessage(String action, Map<String, Object> metadata, Map<String, Object> fullMessage,
                        String key, String metaTypeModel, String parentTwinId,
                        List<Map<String, Object>> upSetList) {
        this.action = action;
        this.metadata = metadata;
        this.fullMessage = fullMessage;
        this.key = key;
        this.metaTypeModel = metaTypeModel;
        this.parentTwinId = parentTwinId;
        this.upSetList = upSetList;
    }

    public boolean isDigitalTwinObject() {
        return "DigitalTwinObject".equals(metaTypeModel);
    }
}
