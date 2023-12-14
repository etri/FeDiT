package kr.co.e8ight.ndxpro.agentManager.domain.dto;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;

public class AgentStatusRequestDto {
    private String agentId;

    @JsonCreator
    public AgentStatusRequestDto(@JsonProperty("agentId") String agentId) {
        this.agentId = agentId;
    }

    public String getAgentId() {
        return agentId;
    }
}
