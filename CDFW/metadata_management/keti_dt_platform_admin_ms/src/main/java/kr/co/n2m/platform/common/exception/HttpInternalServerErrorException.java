package kr.co.n2m.platform.common.exception;

public class HttpInternalServerErrorException extends Exception {

	/**
	 * 
	 */
	private static final long serialVersionUID = 5721197713752101561L;

	/**
	 * 
	 */
	public HttpInternalServerErrorException() {
		super();
	}

	/**
	 * @param message
	 * @param cause
	 */
	public HttpInternalServerErrorException(String message, Throwable cause) {
		super(message, cause);
	}

	/**
	 * @param message
	 */
	public HttpInternalServerErrorException(String message) {
		super(message);
	}

	/**
	 * @param cause
	 */
	public HttpInternalServerErrorException(Throwable cause) {
		super(cause);
	}

}
