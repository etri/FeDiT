package kr.co.n2m.platform.meta.architecture.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/**
 * BAD_REQUEST Exception
 * 
 * @author  n2m
 */
@SuppressWarnings("serial")
@ResponseStatus(code = HttpStatus.BAD_REQUEST)
public class ResBadRequestException extends ResBaseRuntimeException {
	
	public ResBadRequestException() {
		super(HttpStatus.BAD_REQUEST, "잘못된 요청입니다.");
	}
	
	public ResBadRequestException(String reason) {
		super(HttpStatus.BAD_REQUEST, reason);
	}	

	public ResBadRequestException(String reason, Throwable cause) {
		super(HttpStatus.BAD_REQUEST, reason, cause);
	}
	
}
