package net.jw.twin.repository.exception;

import org.springframework.http.HttpStatus;

public interface ErrorStatusInterface {
    HttpStatus getHttpStatus();
    String getResourceName();
    String[] getArgs();
    void setArgs(String[] args);

    String getName();
}
