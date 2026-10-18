package com.federated.ontology.searchRule.dto.ruleDto;

import java.util.HashMap;
import java.util.Map;

public class RuleDSL {
    public String target;
    public Map<String, String> buildingConditions = new HashMap<>();
    public Map<String, String> sensorConditions = new HashMap<>();
}
