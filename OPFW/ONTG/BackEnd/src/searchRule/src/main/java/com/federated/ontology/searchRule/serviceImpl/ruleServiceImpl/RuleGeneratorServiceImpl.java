package com.federated.ontology.searchRule.serviceImpl.ruleServiceImpl;

import com.federated.ontology.searchRule.service.ruleService.RuleGeneratorService;
import org.springframework.stereotype.Service;

@Service
public class RuleGeneratorServiceImpl implements RuleGeneratorService {
    public String generateRule(String location, String sensorType, String status) {
        return "{\n" +
                "  \"ruleId\": \"urn:ngsi-ld:CompositionRule:findCO2Building\",\n" +
                "  \"description\": \"Find buildings in " + location + " with " + sensorType + " sensors in " + status + " state\",\n" +
                "  \"inputCondition\": {\n" +
                "    \"building.address\": \"" + location + "\",\n" +
                "    \"sensor.sensorType\": \"" + sensorType + "\",\n" +
                "    \"sensor.status\": \"" + status + "\"\n" +
                "  },\n" +
                "  \"targetEntity\": \"SmartBuilding\"\n" +
                "}";
    }
}
