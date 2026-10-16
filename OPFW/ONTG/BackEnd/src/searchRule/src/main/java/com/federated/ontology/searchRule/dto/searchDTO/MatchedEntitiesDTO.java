package com.federated.ontology.searchRule.dto.searchDTO;

import java.util.*;

public class MatchedEntitiesDTO {
    private List<Map<String, Object>> entities;

    public MatchedEntitiesDTO() {
        this.entities = new ArrayList<>();
    }

    public MatchedEntitiesDTO(List<Map<String, Object>> entities) {
        this.entities = entities;
    }

    public void setMatchedEntities(Map<String, Object> entity) {
        this.entities.add(entity);
    }

    public List<Map<String, Object>> getMatchedEntities() {
        return entities;
    }

}
