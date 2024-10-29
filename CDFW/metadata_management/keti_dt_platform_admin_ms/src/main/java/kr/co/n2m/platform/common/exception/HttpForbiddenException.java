package kr.co.n2m.platform.common.exception;

public class HttpForbiddenException extends Exception {

	
	/**
	 * 
	 */
	private static final long serialVersionUID = 5721197713752101561L;

	/**
	 * 
	 */
	public HttpForbiddenException() {
		super();
	}

	/**
	 * @param message
	 * @param cause
	 */
	public HttpForbiddenException(String message, Throwable cause) {
		super(message, cause);
	}

	/**
	 * @param message
	 */
	public HttpForbiddenException(String message) {
		super(message);
	}

	/**
	 * @param cause
	 */
	public HttpForbiddenException(Throwable cause) {
		super(cause);
	}
}
