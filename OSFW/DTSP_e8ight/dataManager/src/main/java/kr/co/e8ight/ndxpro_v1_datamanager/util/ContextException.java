package kr.co.e8ight.ndxpro_v1_datamanager.util;

import kr.co.e8ight.ndxpro.common.exception.BaseException;
import kr.co.e8ight.ndxpro.common.exception.error.ErrorCodeInterface;


public class ContextException extends BaseException {

    public ContextException(ErrorCodeInterface errorCode) {
        super(errorCode);
    }

    public ContextException(ErrorCodeInterface errorCode, String msg) {
        super(errorCode, msg);
    }
}

