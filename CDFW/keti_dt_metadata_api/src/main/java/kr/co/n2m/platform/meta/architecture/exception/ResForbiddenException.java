package kr.co.n2m.platform.meta.architecture.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/**
 * FORBIDDEN Exception
 * 
 * @author  n2m
 */
@SuppressWarnings("serial")
@ResponseStatus(code = HttpStatus.FORBIDDEN)
public class ResForbiddenException extends ResBaseRuntimeException {
	
	public ResForbiddenException() {
		super(HttpStatus.FORBIDDEN, "요청에 대한 접근 권한이 없습니다.");
	}
	
	public ResForbiddenException(String reason) {
		super(HttpStatus.FORBIDDEN, reason);
	}	

	public ResForbiddenException(String reason, Throwable cause) {
		super(HttpStatus.FORBIDDEN, reason, cause);
	}
	
}