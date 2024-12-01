package kr.co.e8ight.ndxpro.translatorbuilder.exception;

import kr.co.e8ight.ndxpro.common.exception.BaseException;
import kr.co.e8ight.ndxpro.common.exception.error.ErrorCodeInterface;

public class BuildTranslatorException extends BaseException {

    public BuildTranslatorException(ErrorCodeInterface errorCode) {
        super(errorCode);
    }

    public BuildTranslatorException(ErrorCodeInterface errorCode, String message) {
        super(errorCode, message);
    }
}
