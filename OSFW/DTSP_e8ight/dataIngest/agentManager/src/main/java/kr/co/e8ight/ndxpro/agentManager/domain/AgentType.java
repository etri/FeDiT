package kr.co.e8ight.ndxpro.agentManager.domain;

public enum AgentType {
    HTTP("kr.co.e8ight.ndxpro.dataAdapter.source.HttpSource"),
    HTTPS("kr.co.e8ight.ndxpro.dataAdapter.source.HttpSource");
    private final String classPath;
    AgentType(String classPath) {
        this.classPath = classPath;
    }

    public String getClassPath() {
        return classPath;
    }
}
