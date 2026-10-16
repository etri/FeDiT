package com.federated.ontology.searchRule.controller.ruleController;

import com.federated.ontology.searchRule.service.ruleService.NgsiLdQueryService;
import com.federated.ontology.searchRule.service.ruleService.RuleGeneratorService;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/rules/buildings")
public class CompositionRuleController {

    private final RuleGeneratorService generateRule;
    private final NgsiLdQueryService queryService;

    public CompositionRuleController(RuleGeneratorService generateRule, NgsiLdQueryService queryService) {
        this.generateRule = generateRule;
        this.queryService = queryService;
    }

    @PostMapping("/search")
    public String findBuildings(@RequestBody Map<String, String> body) {
        String city = body.get("city");
        String type = body.get("type");
        String status = body.get("status");

        String rule = generateRule.generateRule(city, type, status);
        return queryService.findBuildingsWithSensor(city, type, status);
    }
}
