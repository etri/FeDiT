package kr.co.n2m.platform.common.exception;

public class AuthException extends Exception {

	/**
	 * 
	 */
	private static final long serialVersionUID = 5721197713752101561L;

	/**
	 * 
	 */
	public AuthException() {
		super();
	}

	/**
	 * @param message
	 * @param cause
	 */
	public AuthException(String message, Throwable cause) {
		super(message, cause);
	}

	/**
	 * @param message
	 */
	public AuthException(String message) {
		super(message);
	}

	/**
	 * @param cause
	 */
	public AuthException(Throwable cause) {
		super(cause);
	}

	
}
