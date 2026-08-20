package kr.co.e8ight.ndxpro.agentManager.exceptions;

import kr.co.e8ight.ndxpro.common.exception.BaseException;
import kr.co.e8ight.ndxpro.common.exception.error.ErrorCode;
import kr.co.e8ight.ndxpro.common.exception.error.ErrorResult;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.ObjectError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

import java.util.List;

@ControllerAdvice
@Slf4j
public class GlobalValidExceptionHandler {
    @ExceptionHandler(MethodArgumentNotValidException.class)
    protected ResponseEntity<ErrorResult> handleMethodArgumentNotValidException(MethodArgumentNotValidException e) {
        StringBuilder messageStringBuilder = new StringBuilder();
        List<ObjectError> allErrors = e.getBindingResult().getAllErrors();
        for (int i = 0; i < allErrors.size(); i++) {
            messageStringBuilder.append("[").append(allErrors.get(i).getDefaultMessage()).append("]");
            if ( i < allErrors.size() - 1 ) {
                messageStringBuilder.append("&");
            }
        }

        ErrorResult errorResult = new ErrorResult(new BaseException(ErrorCode.INVALID_REQUEST, messageStringBuilder.toString()));
        log.error(errorResult.toString(), e);
        return ResponseEntity.status(ErrorCode.INVALID_REQUEST.getStatus()).body(errorResult);
    }
}