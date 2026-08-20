package kr.co.e8ight.ndxpro.fileservice.config.exceptions;

import kr.co.e8ight.ndxpro.common.exception.BaseException;
import kr.co.e8ight.ndxpro.common.exception.error.ErrorCodeInterface;

public class DocumentException extends BaseException {
    public DocumentException(ErrorCodeInterface errorCode) {
        super(errorCode);
    }

    public DocumentException(ErrorCodeInterface errorCode, String message) {
        super(errorCode, message);
    }
}
