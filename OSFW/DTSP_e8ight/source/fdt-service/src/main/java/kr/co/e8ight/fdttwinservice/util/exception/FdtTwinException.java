package kr.co.e8ight.fdttwinservice.util.exception;

import kr.co.e8ight.ndxpro.common.exception.BaseException;
import kr.co.e8ight.ndxpro.common.exception.error.ErrorCodeInterface;

public class FdtTwinException extends BaseException {

    public FdtTwinException(ErrorCodeInterface errorCode) {
        super(errorCode);
    }

    public FdtTwinException(ErrorCodeInterface errorCode, String message) {
        super(errorCode, message);
    }
}
