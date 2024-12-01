package net.jw.twin.data_interface.exception;

import lombok.Getter;
import lombok.Setter;
import net.jw.twin.common.exception.ErrorStatusInterface;
import org.springframework.http.HttpStatus;

import static org.springframework.http.HttpStatus.INTERNAL_SERVER_ERROR;

@Getter
public enum ErrorStatus implements ErrorStatusInterface {

    DB__FAILED(INTERNAL_SERVER_ERROR, "exception.db.fail"),
    DB__NULL_DATA(INTERNAL_SERVER_ERROR, "exception.db.nullData"),
    DB__NOT_FOUND(INTERNAL_SERVER_ERROR, "exception.db.notFound"),
    RECEIVED_PARAM__NULL(INTERNAL_SERVER_ERROR, "exception.receivedParam.nullData"),
    RECEIVED_PARAM__WRONG_TYPE(INTERNAL_SERVER_ERROR, "exception.receivedParam.wrongType")
    ;

    private final HttpStatus httpStatus;
    private final String resourceName;

    @Setter
    private String[] args;

    ErrorStatus(HttpStatus httpStatus, String resourceName, String ... args){
        this.httpStatus = httpStatus;
        this.resourceName = resourceName;
        this.args = args;
    }

    public String getName(){
        return name();
    }
}
