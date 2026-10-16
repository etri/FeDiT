package com.federated.ontology.searchRule.repository;

import com.federated.ontology.searchRule.dto.ruleDto.NgsiLdRule;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Repository
public class RuleRepository {
    private final Map<String, NgsiLdRule> rules = new HashMap<>();

    public void save(NgsiLdRule rule) {
        rules.put(rule.getId(), rule);
    }

    public List<NgsiLdRule> findAll() {
        return new ArrayList<>(rules.values());
    }
}
