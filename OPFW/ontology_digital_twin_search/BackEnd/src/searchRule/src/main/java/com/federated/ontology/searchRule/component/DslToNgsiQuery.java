package com.federated.ontology.searchRule.component;

import com.federated.ontology.searchRule.dto.ruleDto.RuleDSL;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Component
public class DslToNgsiQuery {

    public String toQuery(RuleDSL dsl) {

        List<String> conditions = new ArrayList<>();

        dsl.buildingConditions.forEach((k,v) ->
                conditions.add(k + "==\"" + v + "\"")
        );

        dsl.sensorConditions.forEach((k,v) ->
                conditions.add("hasSensor." + k + "==\"" + v + "\"")
        );

        return "?type=" + dsl.target + "&q=" + String.join(";", conditions);
    }
}
