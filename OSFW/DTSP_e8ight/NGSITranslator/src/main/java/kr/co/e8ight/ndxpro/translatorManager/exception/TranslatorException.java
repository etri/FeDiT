package kr.co.e8ight.ndxpro.translatorManager.exception;

import kr.co.e8ight.ndxpro.common.exception.BaseException;
import kr.co.e8ight.ndxpro.common.exception.error.ErrorCodeInterface;

public class TranslatorException extends BaseException {

    public TranslatorException(ErrorCodeInterface errorCode) {
        super(errorCode);
    }

    public TranslatorException(ErrorCodeInterface errorCode, String message) {
        super(errorCode, message);
    }
}
