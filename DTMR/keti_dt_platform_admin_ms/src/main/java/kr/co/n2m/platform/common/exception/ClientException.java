package kr.co.n2m.platform.common.exception;

public class ClientException extends Exception {

	/**
	 * 
	 */
	private static final long serialVersionUID = 5721197713752101561L;

	/**
	 * 
	 */
	public ClientException() {
		super();
	}

	/**
	 * @param message
	 * @param cause
	 */
	public ClientException(String message, Throwable cause) {
		super(message, cause);
	}

	/**
	 * @param message
	 */
	public ClientException(String message) {
		super(message);
	}

	/**
	 * @param cause
	 */
	public ClientException(Throwable cause) {
		super(cause);
	}

	
}
