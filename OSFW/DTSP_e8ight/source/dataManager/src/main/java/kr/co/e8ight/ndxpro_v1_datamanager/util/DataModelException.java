package kr.co.e8ight.ndxpro_v1_datamanager.util;

import kr.co.e8ight.ndxpro.common.exception.BaseException;
import kr.co.e8ight.ndxpro.common.exception.error.ErrorCodeInterface;

public class DataModelException extends BaseException {

    public DataModelException(ErrorCodeInterface errorCode) {
        super(errorCode);
    }

    public DataModelException(ErrorCodeInterface errorCode, String msg) {
        super(errorCode, msg);
    }

}
