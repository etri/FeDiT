package kr.co.e8ight.ndxpro.translatorManager.exception;

import kr.co.e8ight.ndxpro.common.exception.BaseException;
import kr.co.e8ight.ndxpro.common.exception.error.ErrorCodeInterface;

public class CompileFailedException extends BaseException {

    public CompileFailedException(ErrorCodeInterface errorCode) {
        super(errorCode);
    }

    public CompileFailedException(ErrorCodeInterface errorCode, String message) {
        super(errorCode, message);
    }
}
