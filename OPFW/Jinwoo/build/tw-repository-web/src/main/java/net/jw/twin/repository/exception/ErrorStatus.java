package net.jw.twin.repository.exception;

import lombok.Getter;
import lombok.Setter;
import org.springframework.http.HttpStatus;

import static org.springframework.http.HttpStatus.INTERNAL_SERVER_ERROR;
import static org.springframework.http.HttpStatus.NOT_FOUND;

@Getter
public enum ErrorStatus implements ErrorStatusInterface {

    E_DB__NOT_FOUND(INTERNAL_SERVER_ERROR, "exception.db.notFound"),
    E_DB__ID_ALREADY_EXIST(INTERNAL_SERVER_ERROR, "exception.db.idAlreadyExist"),
    E_DB__FAIL_SELECT(INTERNAL_SERVER_ERROR, "exception.db.failSelect"),
    E_DB__FAIL_INSERT(INTERNAL_SERVER_ERROR, "exception.db.failInsert"),
    E_DB__FAIL_MODIFY(INTERNAL_SERVER_ERROR, "exception.db.failModify"),
    E_DB__FAIL_DELETE(INTERNAL_SERVER_ERROR, "exception.db.failDelete"),
    E_COMMON__INTERNAL_ERROR(INTERNAL_SERVER_ERROR, "exception.common.internal"),
    E_COMMON__RUNTIME_ERROR(INTERNAL_SERVER_ERROR, "exception.common.runtime"),
    E_COMMON__UNKNOWN(NOT_FOUND, "exception.common.unknown"),
    E_COMMON__DATACATEGORY__NO_ICON_FILE(INTERNAL_SERVER_ERROR, "exception.common.dataCategory_noIconFile"),
    E_COMMON__DATACATEGORY(INTERNAL_SERVER_ERROR, "exception.common.dataCategory"),
    E_COMMON__USER(INTERNAL_SERVER_ERROR, "exception.common.user"),
    E_COMMON__SESSION_USER(INTERNAL_SERVER_ERROR, "exception.common.sessionUser"),
    E_COMMON__DATAITEM_MODIFY(INTERNAL_SERVER_ERROR, "exception.common.dataItemModify"),
    E_COMMON__EXCEPTION(INTERNAL_SERVER_ERROR, "exception.common.exception"),
    E_COMMON__MethodArgumentNotValidException(INTERNAL_SERVER_ERROR, "exception.common.methodArgumentNotValidException"),
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
