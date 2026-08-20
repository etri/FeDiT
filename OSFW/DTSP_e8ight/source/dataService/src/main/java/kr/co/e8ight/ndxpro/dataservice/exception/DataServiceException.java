package kr.co.e8ight.ndxpro.dataservice.exception;

import kr.co.e8ight.ndxpro.common.exception.BaseException;
import kr.co.e8ight.ndxpro.common.exception.error.ErrorCodeInterface;

public class DataServiceException extends BaseException {

    public DataServiceException(ErrorCodeInterface errorCode) {
        super(errorCode);
    }

    public DataServiceException(ErrorCodeInterface errorCode, String message) {
        super(errorCode, message);
    }
}