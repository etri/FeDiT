package kr.co.e8ight.auth.exception;

import kr.co.e8ight.ndxpro.common.exception.BaseException;
import kr.co.e8ight.ndxpro.common.exception.error.ErrorCodeInterface;

public class AuthorizationException extends BaseException {

    public AuthorizationException(ErrorCodeInterface errorCode){
        super(errorCode);
    }

    public AuthorizationException(ErrorCodeInterface errorCode, String msg){
        super(errorCode, msg);
    }
}
