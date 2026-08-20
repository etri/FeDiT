package kr.co.e8ight.ndxpro.translatorManager.exception;

import kr.co.e8ight.ndxpro.common.exception.BaseException;
import kr.co.e8ight.ndxpro.common.exception.error.ErrorCodeInterface;

public class MemberServiceException extends BaseException {
    public MemberServiceException(ErrorCodeInterface errorCode) {
        super(errorCode);
    }
    public MemberServiceException(ErrorCodeInterface errorCode, String message) {
        super(errorCode, message);
    }
}
