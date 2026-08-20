package kr.co.e8ight.ndxpro.fileservice.config.exceptions;

import kr.co.e8ight.ndxpro.common.exception.error.ErrorCodeInterface;
import org.springframework.http.HttpStatus;

import java.util.Arrays;

public enum FileErrorCode implements ErrorCodeInterface {
    FILE_IO_ERROR("http://uri.e8ight/ngsi-ld/erros/FileIoError", "File I/O Error", 1500, HttpStatus.INTERNAL_SERVER_ERROR);

    public String type;
    public String title;
    public int code;
    public HttpStatus status;

    private FileErrorCode(String type, String title, int code, HttpStatus status) {
        this.type = type;
        this.title = title;
        this.code = code;
        this.status = status;
    }

    public String getTitle() {
        return this.title;
    }

    public String getType() {
        return this.type;
    }

    public int getCode() {
        return this.code;
    }

    public HttpStatus getStatus() {
        return this.status;
    }

    public static FileErrorCode getErrorCode(String title) throws IllegalArgumentException {
        return (FileErrorCode) Arrays.stream(values()).filter((v) -> {
            return v.title.equals(title);
        }).findFirst().orElseThrow(() -> {
            return new IllegalArgumentException("Unknown Title: " + title);
        });
    }
}
