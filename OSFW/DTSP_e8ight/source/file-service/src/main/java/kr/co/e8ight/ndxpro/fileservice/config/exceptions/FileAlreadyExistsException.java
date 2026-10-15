package kr.co.e8ight.ndxpro.fileservice.config.exceptions;

import kr.co.e8ight.ndxpro.common.exception.BaseException;
import kr.co.e8ight.ndxpro.common.exception.error.ErrorCodeInterface;

public class FileAlreadyExistsException extends BaseException {


  public FileAlreadyExistsException(ErrorCodeInterface errorCode) {
    super(errorCode);
  }

  public FileAlreadyExistsException(ErrorCodeInterface errorCode, String message) {
    super(errorCode, message);
  }
}
