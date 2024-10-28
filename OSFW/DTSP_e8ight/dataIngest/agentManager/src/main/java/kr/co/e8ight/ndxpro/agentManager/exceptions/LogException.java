package kr.co.e8ight.ndxpro.agentManager.exceptions;

import kr.co.e8ight.ndxpro.common.exception.BaseException;
import kr.co.e8ight.ndxpro.common.exception.error.ErrorCodeInterface;

public class LogException extends BaseException {
    public LogException(ErrorCodeInterface errorCode, String message) {
        super(errorCode, message);
    }
}
