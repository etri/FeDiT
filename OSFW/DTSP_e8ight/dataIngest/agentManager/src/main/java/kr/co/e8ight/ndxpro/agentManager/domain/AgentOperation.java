package kr.co.e8ight.ndxpro.agentManager.domain;

import kr.co.e8ight.ndxpro.agentManager.exceptions.AgentException;
import kr.co.e8ight.ndxpro.agentManager.service.operater.Operater;
import kr.co.e8ight.ndxpro.common.exception.error.ErrorCode;

public enum AgentOperation {
    RUN("agentRunOperater"),
    RERUN("agentRerunOperater"),
    STOP("agentStopOperater");

    private Operater operater;
    private String operaterName;

    AgentOperation(String operaterName) {
        this.operaterName = operaterName;
    }

    public static AgentOperation getOperation(String name) {
        try {
            return AgentOperation.valueOf(name.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new AgentException(ErrorCode.BAD_REQUEST_DATA, name + " is invalid operation type.");
        }
    }

    public Operater getOperater() {
        return operater;
    }

    public String getOperaterName() {
        return operaterName;
    }

    public void setOperater(Operater operater) {
        this.operater = operater;
    }
}
