package net.jw.twin.repository.config;

import com.google.gson.Gson;
import lombok.*;
import lombok.extern.slf4j.Slf4j;
import net.jw.twin.repository.exception.CustomException;
import net.jw.twin.repository.exception.ErrorStatus;
import net.jw.twin.repository.exception.ErrorStatusInterface;
import net.jw.twin.repository.response.ResponseService;
import org.apache.commons.lang3.exception.ExceptionUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.util.ObjectUtils;
import org.springframework.util.StringUtils;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.servlet.ModelAndView;

import javax.servlet.http.HttpServletRequest;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;


@Slf4j
@ControllerAdvice
@RequiredArgsConstructor
public class ExceptionAdvice {

    @Autowired
    private ResponseService responseService;

    private final Gson gson;

    @Getter
    @Setter
    @Builder
    @AllArgsConstructor
    static class ServerLog {
        String uuid;
        String fileName;
        String methodName;
        Integer lineNumber;
        String errorStatus;
        String message;
        String detailMessage;
        String exceptionMessage;
        String stack;
        Map<String, Object> extraData;
    }

    @Setter
    @Getter
    @Builder
    static class ClientLog {
        private String uuid;
        private String errorStatus;
        private String message;
        private String detailMessage;
        private Map<String, Object> extraData;
    }

    @Setter
    @Getter
    @AllArgsConstructor
    static class ErrorData {
        ServerLog serverLog;
        ClientLog clientLog;
    }

    private ErrorData getErrorData(Exception e, ErrorStatusInterface errorStatusInterface) {
        String uuid = UUID.randomUUID().toString();
        String clientMessage = MessageSourceUtil.getMessageFromErrorStatus(errorStatusInterface);
        String clientDetailMessage = null;
        String detailMessage = "";
        if(e instanceof CustomException) {
            CustomException ce = (CustomException)e;
            detailMessage = ce.getDebugMessage();

            if(ce.isSendDetailMessage()){
                clientDetailMessage = ce.getDebugMessage();
            }
        }

        StackTraceElement cth = e.getStackTrace()[0];

        ServerLog serverLog = ServerLog.builder()
                .uuid(uuid)
                .fileName(cth.getFileName())
                .methodName(cth.getMethodName())
                .lineNumber(cth.getLineNumber())
                .errorStatus(errorStatusInterface.getName())
                .message(clientMessage)
                .detailMessage(detailMessage)
                .exceptionMessage(e.getMessage())
                .stack(ExceptionUtils.getStackTrace(e))
                .build();

        ClientLog clientLog = ClientLog.builder()
                .uuid(uuid)
                .errorStatus(errorStatusInterface.getName())
                .message(clientMessage)
                .detailMessage(clientDetailMessage)
                .build();

        return new ErrorData(serverLog, clientLog);
    }

    @ExceptionHandler(Exception.class)
    protected Object defaultException(HttpServletRequest request, Exception e) {
        ErrorStatusInterface errorStatusInterface = ErrorStatus.E_COMMON__EXCEPTION;
        ErrorData errorData = getErrorData(e, errorStatusInterface);

        log.error(gson.toJson(errorData.serverLog));

        String ext = request.getRequestURI();
        if (ext.endsWith(".json")) {
            return ResponseEntity.status(errorStatusInterface.getHttpStatus()).body(errorData.getClientLog());
        }

        ModelAndView mav = new ModelAndView();
        mav.setViewName("error/error");
        mav.addObject("errorCode", errorStatusInterface.getHttpStatus().value());
        mav.addObject("errorLog", errorData.getClientLog());
        return mav;
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    protected Object methodArgumentNotValidException(HttpServletRequest request, MethodArgumentNotValidException e) {
        ErrorStatusInterface errorStatusInterface = ErrorStatus.E_COMMON__MethodArgumentNotValidException;

        ErrorData errorData = getErrorData(e, errorStatusInterface);


        HashMap<String, Object> clientExtraData = new HashMap<>();
        HashMap<String, Object> serverExtraData = new HashMap<>();

        List<FieldError> errors = e.getBindingResult().getFieldErrors();
        errors.forEach(error -> {
            serverExtraData.put("objectName",error.getObjectName());
            serverExtraData.put("fieldName",error.getField());
            serverExtraData.put("rejectedValue", ObjectUtils.nullSafeToString(error.getRejectedValue()));
            serverExtraData.put("codes", StringUtils.arrayToDelimitedString(error.getCodes(), ","));
            serverExtraData.put("defaultMessage",error.getDefaultMessage());

            errorData.getClientLog().setMessage(error.getDefaultMessage());
        });


        errorData.serverLog.setExtraData(serverExtraData);

        log.error(gson.toJson(errorData.serverLog));

        String ext = request.getRequestURI();
        if (ext.endsWith(".json")) {
            return ResponseEntity.status(errorStatusInterface.getHttpStatus()).body(errorData.getClientLog());
        }

        ModelAndView mav = new ModelAndView();
        mav.setViewName("error/error");
        mav.addObject("errorCode", errorStatusInterface.getHttpStatus().value());
        mav.addObject("errorLog", errorData.getClientLog());
        return mav;
    }

    @ExceptionHandler(CustomException.class)
    protected Object customException(HttpServletRequest request, CustomException e) {
        ErrorStatusInterface errorStatusInterface = e.getErrorStatus();
        ErrorData errorData = getErrorData(e, errorStatusInterface);

        log.error(gson.toJson(errorData.serverLog));

        String ext = request.getRequestURI();
        if (ext.endsWith(".json")) {
            return ResponseEntity.status(errorStatusInterface.getHttpStatus()).body(errorData.getClientLog());
        }

        ModelAndView mav = new ModelAndView();
        mav.setViewName("error/error");
        mav.addObject("errorCode", errorStatusInterface.getHttpStatus().value());
        mav.addObject("errorLog", errorData.getClientLog());
        return mav;
    }
}