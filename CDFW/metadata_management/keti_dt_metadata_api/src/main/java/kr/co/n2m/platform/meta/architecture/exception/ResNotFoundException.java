package kr.co.n2m.platform.meta.architecture.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/**
 * NOT_FOUND Exception
 * 
 * @author  n2m
 */
@SuppressWarnings("serial")
@ResponseStatus(code = HttpStatus.NOT_FOUND)
public class ResNotFoundException extends ResBaseRuntimeException {
	
	public ResNotFoundException() {
		super(HttpStatus.NOT_FOUND, "해당 리소스가 존재하지 않습니다.");
	}
	
	public ResNotFoundException(String reason) {
		super(HttpStatus.NOT_FOUND, reason);
	}	

	public ResNotFoundException(String reason, Throwable cause) {
		super(HttpStatus.NOT_FOUND, reason, cause);
	}
	
    // apiResCode 지정 생성자
    public ResNotFoundException(int apiResCode, String reason) {
        super(apiResCode, HttpStatus.NOT_FOUND, reason);
    }

    public ResNotFoundException(int apiResCode, String reason, Throwable cause) {
        super(apiResCode, HttpStatus.NOT_FOUND, reason, cause);
    }
	
}