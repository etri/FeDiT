package kr.co.e8ight.ndxpro.fileservice.config;

import com.fasterxml.jackson.databind.exc.MismatchedInputException;
import kr.co.e8ight.ndxpro.common.exception.BaseException;
import kr.co.e8ight.ndxpro.common.exception.HttpException;
import kr.co.e8ight.ndxpro.common.exception.error.ErrorCode;
import kr.co.e8ight.ndxpro.common.exception.error.ErrorResult;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {
    public GlobalExceptionHandler() {
    }

    @ExceptionHandler({BaseException.class})
    public ResponseEntity<ErrorResult> baseException(BaseException e) {
        ErrorResult errorResult = new ErrorResult(e);
        log.error(errorResult.toString(), e);
        return ResponseEntity.status(e.errorCode.getStatus()).body(errorResult);
    }

    @ExceptionHandler({HttpException.class})
    public ResponseEntity<ErrorResult> httpException(HttpException e) {
        ErrorResult errorResult = new ErrorResult(e);
        log.error(errorResult.toString(), e);
        return ResponseEntity.status(e.errorCode.getStatus()).body(errorResult);
    }

    @ExceptionHandler({MismatchedInputException.class})
    public ResponseEntity<ErrorResult> mismatchedInputException(MismatchedInputException e) {
        BaseException baseException = new BaseException(ErrorCode.INVALID_REQUEST, "JSON Serialize Error");
        ErrorResult errorResult = new ErrorResult(baseException);
        log.error(errorResult.toString(), e);
        return ResponseEntity.status(baseException.errorCode.getStatus()).body(errorResult);
    }

    @ExceptionHandler(MissingServletRequestParameterException.class)
    public ResponseEntity<ErrorResult> handleMissingParams(MissingServletRequestParameterException e) {
        BaseException baseException = new BaseException(ErrorCode.INVALID_REQUEST, e.getMessage());
        ErrorResult errorResult = new ErrorResult(baseException);
        log.error(errorResult.toString(), e);
        return ResponseEntity.status(baseException.errorCode.getStatus()).body(errorResult);
    }
}