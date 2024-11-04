package kr.co.e8ight.ndxpro.dataAdapter.source;

public class SourceConfig {
    private String urlAddr;

    private int connTerm;

    private String method;

    private String jsonBody;

    private Long agentId;

    public SourceConfig(String urlAddr, int connTerm, Long agentId, String method, String jsonBody) {
        this.urlAddr = urlAddr;
        this.connTerm = connTerm;
        this.agentId = agentId;
        this.method = method;
        this.jsonBody = jsonBody;
    }

    public String getUrlAddr() {
        return urlAddr;
    }

    public int getConnTerm() {
        return connTerm;
    }

    public Long getAgentId() {
        return agentId;
    }

    public String getMethod() {
        return method;
    }

    public String getJsonBody() {
        return jsonBody;
    }
}
