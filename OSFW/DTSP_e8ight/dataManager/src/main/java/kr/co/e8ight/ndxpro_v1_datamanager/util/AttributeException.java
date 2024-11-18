package kr.co.e8ight.ndxpro_v1_datamanager.util;

import kr.co.e8ight.ndxpro.common.exception.BaseException;
import kr.co.e8ight.ndxpro.common.exception.error.ErrorCodeInterface;

public class AttributeException extends BaseException {

    public AttributeException(ErrorCodeInterface errorCode) {
        super(errorCode);
    }

    public AttributeException(ErrorCodeInterface errorCode, String msg) {
        super(errorCode, msg);
    }
}
