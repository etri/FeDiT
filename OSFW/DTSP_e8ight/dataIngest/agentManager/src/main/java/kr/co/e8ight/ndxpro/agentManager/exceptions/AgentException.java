package kr.co.e8ight.ndxpro.agentManager.exceptions;

import kr.co.e8ight.ndxpro.common.exception.BaseException;
import kr.co.e8ight.ndxpro.common.exception.error.ErrorCodeInterface;

public class AgentException extends BaseException {
    public AgentException(ErrorCodeInterface errorCode) {
        super(errorCode);
    }

    public AgentException(ErrorCodeInterface errorCode, String message) {
        super(errorCode, message);
    }
}
