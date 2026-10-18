package com.federated.ontology.searchRule.dto.kafkaDto;

import lombok.Getter;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
public class InitResultDto {

    private String status;
    private int twinCount;
    private int objectCount;
    private int neo4jSyncSubmitted;
    private List<String> errors = new ArrayList<>();

    public static InitResultDto success(int twinCount, int objectCount, int neo4jSyncSubmitted) {
        InitResultDto dto = new InitResultDto();
        dto.setStatus("SUCCESS");
        dto.setTwinCount(twinCount);
        dto.setObjectCount(objectCount);
        dto.setNeo4jSyncSubmitted(neo4jSyncSubmitted);
        return dto;
    }

    public static InitResultDto partial(int twinCount, int objectCount, int neo4jSyncSubmitted, List<String> errors) {
        InitResultDto dto = new InitResultDto();
        dto.setStatus("PARTIAL");
        dto.setTwinCount(twinCount);
        dto.setObjectCount(objectCount);
        dto.setNeo4jSyncSubmitted(neo4jSyncSubmitted);
        dto.setErrors(errors);
        return dto;
    }

    public static InitResultDto fail(String errorMessage) {
        InitResultDto dto = new InitResultDto();
        dto.setStatus("FAIL");
        dto.setErrors(List.of(errorMessage));
        return dto;
    }

    public void addError(String error) {
        this.errors.add(error);
    }

    public boolean hasErrors() {
        return !errors.isEmpty();
    }
}
