package kr.co.n2m.platform.common.exception;

public class HttpNotFoundException extends Exception {

	/**
	 * 
	 */
	private static final long serialVersionUID = 5721197713752101561L;

	/**
	 * 
	 */
	public HttpNotFoundException() {
		super();
	}

	/**
	 * @param message
	 * @param cause
	 */
	public HttpNotFoundException(String message, Throwable cause) {
		super(message, cause);
	}

	/**
	 * @param message
	 */
	public HttpNotFoundException(String message) {
		super(message);
	}

	/**
	 * @param cause
	 */
	public HttpNotFoundException(Throwable cause) {
		super(cause);
	}
}
