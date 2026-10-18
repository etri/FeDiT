package com.federated.ontology.searchRule.repository;

import com.federated.ontology.searchRule.dto.ruleDto.NgsiLdRule;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class RuleRepositoryTest {

    @Test
    void saveStoresAndOverwritesById() {
        RuleRepository repository = new RuleRepository();
        NgsiLdRule rule = createRule("urn:ngsi-ld:rule:1", "first");
        repository.save(rule);

        NgsiLdRule updated = createRule("urn:ngsi-ld:rule:1", "updated");
        repository.save(updated);

        List<NgsiLdRule> rules = repository.findAll();

        assertThat(rules)
                .hasSize(1)
                .first()
                .extracting(NgsiLdRule::getDescription)
                .isEqualTo("updated");
    }

    @Test
    void findAllReturnsDefensiveCopy() {
        RuleRepository repository = new RuleRepository();
        repository.save(createRule("urn:ngsi-ld:rule:2", "any"));

        List<NgsiLdRule> rules = repository.findAll();
        rules.clear();

        assertThat(repository.findAll()).hasSize(1);
    }

    private NgsiLdRule createRule(String id, String description) {
        NgsiLdRule rule = new NgsiLdRule();
        rule.setId(id);
        rule.setDescription(description);
        return rule;
    }
}
