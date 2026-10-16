package com.federated.ontology.searchRule.component;

import com.federated.ontology.searchRule.dto.ruleDto.RuleDSL;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class RuleDslParserTest {

    private final RuleDslParser parser = new RuleDslParser();

    @Test
    void parseExtractsKnownKeywordsIntoRuleDsl() {
        RuleDSL dsl = parser.parse("부산에 위치한 CO2 센서가 활성 상태인 관광지");

        assertThat(dsl.target).isEqualTo("관광");
        assertThat(dsl.buildingConditions).containsEntry("address", "Busan");
        assertThat(dsl.sensorConditions)
                .containsEntry("sensorType", "CO2")
                .containsEntry("status", "active");
    }

    @Test
    void parseReturnsEmptyConditionsWhenKeywordsMissing() {
        RuleDSL dsl = parser.parse("아무 조건도 포함하지 않은 문장");

        assertThat(dsl.buildingConditions).isEmpty();
        assertThat(dsl.sensorConditions).isEmpty();
    }
}
