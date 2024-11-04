package kr.co.e8ight.ndxpro.agentManager.exceptions;

import kr.co.e8ight.ndxpro.common.exception.BaseException;
import kr.co.e8ight.ndxpro.common.exception.error.ErrorCodeInterface;

public class HttpRequestFailedException extends BaseException {
    public HttpRequestFailedException(ErrorCodeInterface errorCode) {
        super(errorCode);
    }

    public HttpRequestFailedException(ErrorCodeInterface errorCode, String message) {
        super(errorCode, message);
    }
}
