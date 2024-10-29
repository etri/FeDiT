package kr.co.n2m.platform.meta.architecture.exception;

import org.springframework.http.HttpStatus;
import org.springframework.lang.Nullable;
import org.springframework.web.server.ResponseStatusException;

/**
 * ResponseStatusException 을 상속한 Base class.
 * 
 * @author  n2m
 */
@SuppressWarnings("serial")
public class ResBaseRuntimeException extends ResponseStatusException {
	
	public ResBaseRuntimeException() {
		super(HttpStatus.INTERNAL_SERVER_ERROR, "서버에서 오류가 발생했습니다.");
	}
	
	public ResBaseRuntimeException(String reason) {
		super(HttpStatus.INTERNAL_SERVER_ERROR, reason);
	}	

	public ResBaseRuntimeException(String reason, Throwable cause) {
		super(HttpStatus.INTERNAL_SERVER_ERROR, reason, cause);
	}
	
	public ResBaseRuntimeException(HttpStatus status, @Nullable String reason) {
		super(status, reason);
	}
	
	public ResBaseRuntimeException(HttpStatus status, @Nullable String reason, @Nullable Throwable cause) {
		super(status, reason, cause);
	}

	public ResBaseRuntimeException(int rawStatusCode, @Nullable String reason, @Nullable Throwable cause) {
		super(rawStatusCode, reason, cause);
	}
	
	public ResBaseRuntimeException(Throwable cause) {
		super(HttpStatus.INTERNAL_SERVER_ERROR, "서버에서 오류가 발생했습니다.", cause);
	}	
	
}
