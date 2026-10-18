package com.federated.ontology.searchRule.dto.ruleDto;

import java.util.Map;

public class NgsiLdRule {
    private String id;
    private String description;
    private String targetType;
    private Map<String, String> conditions;
    private int intervalSec;

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getTargetType() {
        return targetType;
    }

    public void setTargetType(String targetType) {
        this.targetType = targetType;
    }

    public Map<String, String> getConditions() {
        return conditions;
    }

    public void setConditions(Map<String, String> conditions) {
        this.conditions = conditions;
    }

    public int getIntervalSec() {
        return intervalSec;
    }

    public void setIntervalSec(int intervalSec) {
        this.intervalSec = intervalSec;
    }
}
