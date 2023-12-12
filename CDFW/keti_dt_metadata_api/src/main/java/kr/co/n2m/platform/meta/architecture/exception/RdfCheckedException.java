package kr.co.n2m.platform.meta.architecture.exception;

import org.springframework.lang.Nullable;

@SuppressWarnings("serial")
public class RdfCheckedException extends InnerCheckedException {

	public RdfCheckedException() {
		this("RDF 내부 오류를 체크해서 처리해 주세요!");
	}
	
	public RdfCheckedException(String reason) {
		super(reason);
	}

	public RdfCheckedException(String reason, String code) {
		super(reason, code);
	}

	public RdfCheckedException(String reason, String code, @Nullable Throwable cause) {
		super(reason, code, cause);
	}
	
}
