package kr.co.e8ight.ndxpro.agentManager.domain;

import kr.co.e8ight.ndxpro.agentManager.domain.dto.OperationRequestDto;
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

    public static AgentOperation getOperation(OperationRequestDto requestDto) {
        try {
            return AgentOperation.valueOf(requestDto.getOperation().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new AgentException(ErrorCode.BAD_REQUEST_DATA, requestDto + " is invalid operation type.");
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
