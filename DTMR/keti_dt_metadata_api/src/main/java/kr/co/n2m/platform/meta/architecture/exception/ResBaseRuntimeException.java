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
	
    private final int apiResCode; // 2025-07-25 추가.
	
	public ResBaseRuntimeException() {
		super(HttpStatus.INTERNAL_SERVER_ERROR, "서버에서 오류가 발생했습니다.");
		this.apiResCode = 5000;
	}
	
	public ResBaseRuntimeException(String reason) {
		super(HttpStatus.INTERNAL_SERVER_ERROR, reason);
		this.apiResCode = 5000;
	}	

	public ResBaseRuntimeException(String reason, Throwable cause) {
		super(HttpStatus.INTERNAL_SERVER_ERROR, reason, cause);
		this.apiResCode = 5000;
	}
	
	public ResBaseRuntimeException(HttpStatus status, @Nullable String reason) {
		super(status, reason);
		this.apiResCode = 5000;
	}
	
	public ResBaseRuntimeException(HttpStatus status, @Nullable String reason, @Nullable Throwable cause) {
		super(status, reason, cause);
		this.apiResCode = 5000;
	}

	public ResBaseRuntimeException(Throwable cause) {
		super(HttpStatus.INTERNAL_SERVER_ERROR, "서버에서 오류가 발생했습니다.", cause);
		this.apiResCode = 5000;
	}
	
    // apiResCode 지정 생성자
    public ResBaseRuntimeException(int apiResCode, String reason) {
        super(HttpStatus.INTERNAL_SERVER_ERROR, reason);
        this.apiResCode = apiResCode;
    }

    public ResBaseRuntimeException(int apiResCode, String reason, Throwable cause) {
        super(HttpStatus.INTERNAL_SERVER_ERROR, reason, cause);
        this.apiResCode = apiResCode;
    }
    
	public ResBaseRuntimeException(int apiResCode, HttpStatus status, @Nullable String reason) {
		super(status, reason);
		this.apiResCode = apiResCode;
	}
	
	public ResBaseRuntimeException(int apiResCode, HttpStatus status, @Nullable String reason, @Nullable Throwable cause) {
		super(status, reason, cause);
		this.apiResCode = apiResCode;
	}    
	
    public int getApiResCode() {
        return apiResCode;
    }
	
}
