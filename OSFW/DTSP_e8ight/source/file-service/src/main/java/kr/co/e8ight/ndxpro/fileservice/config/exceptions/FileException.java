package kr.co.e8ight.ndxpro.fileservice.config.exceptions;

import kr.co.e8ight.ndxpro.common.exception.BaseException;
import kr.co.e8ight.ndxpro.common.exception.error.ErrorCodeInterface;

public class FileException extends BaseException {
    public FileException(ErrorCodeInterface errorCode) {
        super(errorCode);
    }

    public FileException(ErrorCodeInterface errorCode, String message) {
        super(errorCode, message);
    }
}
