package net.jw.twin.repository.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public class CustomException extends RuntimeException {
    public enum SEND_DETAIL_MESSAGE {
        TRUE,
        FALSE
    }

    private final ErrorStatusInterface errorStatus;
    private String debugMessage;
    private final SEND_DETAIL_MESSAGE sendDetailMessage;

    public CustomException(ErrorStatusInterface errorStatus, Throwable cause, String debugMessage, String ... args) {
        super(cause);

        this.errorStatus = errorStatus;
        this.debugMessage = debugMessage;
        this.errorStatus.setArgs(args);
        this.sendDetailMessage = SEND_DETAIL_MESSAGE.FALSE;
    }

    public CustomException(ErrorStatusInterface errorStatus, String debugMessage, String ... args) {
        this.errorStatus = errorStatus;
        this.debugMessage = debugMessage;
        this.errorStatus.setArgs(args);
        this.sendDetailMessage = SEND_DETAIL_MESSAGE.FALSE;
    }

    public CustomException(ErrorStatusInterface errorStatus, SEND_DETAIL_MESSAGE sendDetailMessage, String debugMessage, String ... args) {
        this.errorStatus = errorStatus;
        this.debugMessage = debugMessage;
        this.errorStatus.setArgs(args);
        this.sendDetailMessage = sendDetailMessage;
    }

    public boolean isSendDetailMessage() {
        return sendDetailMessage==SEND_DETAIL_MESSAGE.TRUE;
    }

    public HttpStatus getHttpStatus(){
        return errorStatus.getHttpStatus();
    }

    public String getErrorStatusName(){
        return errorStatus.getName();
    }
}