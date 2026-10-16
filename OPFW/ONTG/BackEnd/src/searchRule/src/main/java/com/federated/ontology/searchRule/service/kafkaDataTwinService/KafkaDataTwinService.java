package com.federated.ontology.searchRule.service.kafkaDataTwinService;

import com.federated.ontology.searchRule.dto.kafkaDto.DigitalTwinMetaInfo;

import java.util.List;
import java.util.Map;
import java.util.Set;

public interface KafkaDataTwinService {
    List<Map<String, Object>> createOntology(DigitalTwinMetaInfo metaInfo);
}
