package net.jw.twin.tw_service_manager.exception;

import lombok.Getter;
import lombok.Setter;
import net.jw.twin.common.exception.ErrorStatusInterface;
import org.springframework.http.HttpStatus;

@Getter
public enum ErrorStatus implements ErrorStatusInterface {
    // 추가 status
    DATAUSE__EXCEED_MAXCOUNT(HttpStatus.INTERNAL_SERVER_ERROR, "exception.dataUse.exceedMaxcount"),
    DB__FAIL_UPDATE(HttpStatus.INTERNAL_SERVER_ERROR, "exception.db.update"),
    DB__FAIL_SELECT(HttpStatus.INTERNAL_SERVER_ERROR, "exception.db.select"),
    DB__FAIL_SELECT_NOT_FOUND(HttpStatus.INTERNAL_SERVER_ERROR, "exception.db.selectNotFound"),
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
