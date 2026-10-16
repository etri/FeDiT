package com.federated.ontology.searchRule.controller.ruleController;

import com.federated.ontology.searchRule.repository.RuleRepository;
import com.federated.ontology.searchRule.dto.ruleDto.NgsiLdRule;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/rules")
public class RuleController {

    private final RuleRepository ruleRepository;

    public RuleController(RuleRepository ruleRepository) {
        this.ruleRepository = ruleRepository;
    }

    @PostMapping
    public String registerRule(@RequestBody NgsiLdRule rule) {
        ruleRepository.save(rule);
        return "Rule registered: " + rule.getDescription();
    }
}
