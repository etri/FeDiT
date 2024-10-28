package kr.co.e8ight.ndxpro.databroker.exception;

import kr.co.e8ight.ndxpro.common.exception.BaseException;
import kr.co.e8ight.ndxpro.common.exception.error.ErrorCodeInterface;

public class DataBrokerException extends BaseException {

    public DataBrokerException(ErrorCodeInterface errorCode) {
        super(errorCode);
    }

    public DataBrokerException(ErrorCodeInterface errorCode, String message) {
        super(errorCode, message);
    }
}