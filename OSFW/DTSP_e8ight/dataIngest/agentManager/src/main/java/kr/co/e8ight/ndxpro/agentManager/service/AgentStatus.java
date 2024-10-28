package kr.co.e8ight.ndxpro.agentManager.service;

import kr.co.e8ight.ndxpro.agentManager.exceptions.AgentException;
import kr.co.e8ight.ndxpro.common.exception.error.ErrorCode;

public enum AgentStatus {
    CREATED, RUN, STOP, DELETED, HANG, DIED;

    public static AgentStatus of(String name) {
        try {
            if ( name != null ) {
                return AgentStatus.valueOf(name.toUpperCase());
            } else {
                return null;
            }
        } catch (IllegalArgumentException e) {
            throw new AgentException(ErrorCode.INVALID_REQUEST, "'" + name + "' is invalid status.");
        }
    }

    public boolean isAlive() {
        return this.equals(RUN) || this.equals(HANG);
    }
}
