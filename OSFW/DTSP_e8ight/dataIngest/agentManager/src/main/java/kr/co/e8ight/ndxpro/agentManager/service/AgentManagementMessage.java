package kr.co.e8ight.ndxpro.agentManager.service;

public enum AgentManagementMessage {
    SUCCESS("success"),
    ALREADY_RUNNING("Agent already running"),
    CONFIG_FILE_NOT_EXIST("Agent Config File does not exist"),
    IS_NOT_RUNNING("Agent is not running");

    private String description;

    AgentManagementMessage(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}
