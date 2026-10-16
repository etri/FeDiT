package com.federated.ontology.searchRule.serviceImpl.ruleServiceImpl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class RuleGeneratorServiceImplTest {

    private final RuleGeneratorServiceImpl service = new RuleGeneratorServiceImpl();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void generateRuleInjectsParametersIntoTemplate() throws Exception {
        String json = service.generateRule("Busan", "CO2", "active");

        JsonNode node = objectMapper.readTree(json);

        assertThat(node.get("description").asText())
                .contains("Busan")
                .contains("CO2")
                .contains("active");

        JsonNode inputCondition = node.get("inputCondition");
        assertThat(inputCondition.get("building.address").asText()).isEqualTo("Busan");
        assertThat(inputCondition.get("sensor.sensorType").asText()).isEqualTo("CO2");
        assertThat(inputCondition.get("sensor.status").asText()).isEqualTo("active");
        assertThat(node.get("targetEntity").asText()).isEqualTo("SmartBuilding");
    }
}
