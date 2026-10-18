package com.federated.ontology.searchRule.component;

import com.federated.ontology.searchRule.dto.ruleDto.RuleDSL;
import org.junit.jupiter.api.Test;

import java.util.LinkedHashMap;

import static org.assertj.core.api.Assertions.assertThat;

class DslToNgsiQueryTest {

    private final DslToNgsiQuery converter = new DslToNgsiQuery();

    @Test
    void toQueryGeneratesBuildingAndSensorConditions() {
        RuleDSL dsl = new RuleDSL();
        dsl.target = "SmartBuilding";
        dsl.buildingConditions = new LinkedHashMap<>();
        dsl.sensorConditions = new LinkedHashMap<>();
        dsl.buildingConditions.put("address", "Busan");
        dsl.sensorConditions.put("sensorType", "CO2");
        dsl.sensorConditions.put("status", "active");

        String query = converter.toQuery(dsl);

        assertThat(query)
                .isEqualTo("?type=SmartBuilding&q=address==\"Busan\";hasSensor.sensorType==\"CO2\";hasSensor.status==\"active\"");
    }

    @Test
    void toQueryHandlesEmptyConditionMaps() {
        RuleDSL dsl = new RuleDSL();
        dsl.target = "관광";

        String query = converter.toQuery(dsl);

        assertThat(query).isEqualTo("?type=관광&q=");
    }
}
