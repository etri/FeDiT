package kr.co.n2m.platform.meta.architecture.exception;

import org.springframework.lang.Nullable;

/**
 * 내부에서만 사용하는 Exception. 로직상 무조건 처리해야 하는 경우 사용.
 * 
 * @author  n2m
 */
@SuppressWarnings("serial")
public class InnerCheckedException extends Exception {
	
	private final String reason;
	
	private String code = "INNER_ERROR";
	
	public InnerCheckedException() {
		this("내부 오류를 체크해서 처리해 주세요!", "INNER_ERROR");
	}
	
	public InnerCheckedException(String reason) {
		super(reason);
		this.reason = reason;
	}

	public InnerCheckedException(String reason, String code) {
		super(reason);
		this.reason = reason;		
		this.code   = code;
	}

	public InnerCheckedException(String reason, String code, @Nullable Throwable cause) {
		super(reason, cause);
		this.reason = reason;		
		this.code   = code;;
	}	
	
	public String getReason() {
		return this.reason;
	}	
	
	public String getCode() {
		return this.code;
	}
	
	@Override
	public String getMessage() {
		return "[" + code + "]" + (this.reason != null ? this.reason : "");
	}	
	
}
