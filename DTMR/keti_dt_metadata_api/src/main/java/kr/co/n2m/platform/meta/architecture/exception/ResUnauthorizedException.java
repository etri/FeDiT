package kr.co.n2m.platform.meta.architecture.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/**
 * UNAUTHORIZED Exception
 * 
 * @author  n2m
 */
@SuppressWarnings("serial")
@ResponseStatus(code = HttpStatus.UNAUTHORIZED)
public class ResUnauthorizedException extends ResBaseRuntimeException {
	
	public ResUnauthorizedException() {
		super(HttpStatus.UNAUTHORIZED, "권한이 없는 클라이언트(사용자)입니다.");
	}
	
	public ResUnauthorizedException(String reason) {
		super(HttpStatus.UNAUTHORIZED, reason);
	}	

	public ResUnauthorizedException(String reason, Throwable cause) {
		super(HttpStatus.UNAUTHORIZED, reason, cause);
	}
	
    // apiResCode 지정 생성자
    public ResUnauthorizedException(int apiResCode, String reason) {
        super(apiResCode, HttpStatus.UNAUTHORIZED, reason);
    }

    public ResUnauthorizedException(int apiResCode, String reason, Throwable cause) {
        super(apiResCode, HttpStatus.UNAUTHORIZED, reason, cause);
    }
    
}
