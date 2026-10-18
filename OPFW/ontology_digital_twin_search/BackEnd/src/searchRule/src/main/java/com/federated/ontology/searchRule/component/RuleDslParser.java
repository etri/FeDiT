package com.federated.ontology.searchRule.component;

import com.federated.ontology.searchRule.dto.ruleDto.RuleDSL;
import org.springframework.stereotype.Component;

@Component
public class RuleDslParser {

    public RuleDSL parse(String text) {
        RuleDSL dsl = new RuleDSL();
        dsl.target = "관광";

        if (text.contains("부산")) dsl.buildingConditions.put("address", "Busan");
        if (text.contains("CO2")) dsl.sensorConditions.put("sensorType", "CO2");
        if (text.contains("활성")) dsl.sensorConditions.put("status", "active");

        return dsl;
    }
}
