package kr.co.n2m.platform.common.exception;

public class HttpUnauthorizedExcpetion extends Exception {

	
	/**
	 * 
	 */
	private static final long serialVersionUID = 5721197713752101561L;

	/**
	 * 
	 */
	public HttpUnauthorizedExcpetion() {
		super();
	}
	
	/**
	 * @param message
	 * @param cause
	 */
	public HttpUnauthorizedExcpetion(String message, Throwable cause) {
		super(message, cause);
	}

	/**
	 * @param message
	 */
	public HttpUnauthorizedExcpetion(String message) {
		super(message);
	}

	/**
	 * @param cause
	 */
	public HttpUnauthorizedExcpetion(Throwable cause) {
		super(cause);
	}
}
