package kr.co.n2m.platform.meta.architecture.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/**
 * UNPROCESSABLE_ENTITY Exception. 내부 로직 체크용.
 * 
 * @author  n2m
 */
@SuppressWarnings("serial")
@ResponseStatus(code = HttpStatus.UNPROCESSABLE_ENTITY) // 422 Unprocessable Entity (WebDAV) 사용
public class ResBizInfoException extends ResBaseRuntimeException {
	
	public ResBizInfoException() {
		super(HttpStatus.UNPROCESSABLE_ENTITY, "요청을 처리할 수 없습니다.");
	}
	
	public ResBizInfoException(String reason) {
		super(HttpStatus.UNPROCESSABLE_ENTITY, reason);
	}	

	public ResBizInfoException(String reason, Throwable cause) {
		super(HttpStatus.UNPROCESSABLE_ENTITY, reason, cause);
	}
	
}