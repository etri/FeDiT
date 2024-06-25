package kr.co.n2m.platform.common.exception;

public class ConflictException extends Exception {

	/**
	 * 
	 */
	private static final long serialVersionUID = 5721197713752101561L;

	/**
	 * 
	 */
	public ConflictException() {
		super();
	}

	/**
	 * @param message
	 * @param cause
	 */
	public ConflictException(String message, Throwable cause) {
		super(message, cause);
	}

	/**
	 * @param message
	 */
	public ConflictException(String message) {
		super(message);
	}

	/**
	 * @param cause
	 */
	public ConflictException(Throwable cause) {
		super(cause);
	}

	
}
