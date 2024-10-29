package kr.co.n2m.platform.common.exception;

public class GlobalException extends RuntimeException {

	private int code = 5000;
	
	/**
	 * 
	 */
	private static final long serialVersionUID = 5721197713752101561L;

	/**
	 * 
	 */
	public GlobalException() {
		super();
	}

	/**
	 * @param message
	 * @param cause
	 */
	public GlobalException(String message, Throwable cause) {
		super(message, cause);
	}

	/**
	 * @param message
	 */
	public GlobalException(String message) {
		super(message);
	}

	/**
	 * @param cause
	 */
	public GlobalException(Throwable cause) {
		super(cause);
	}
	
	public GlobalException(int code, String message) {
		super(message);
		
		this.code = code;
	}
	
	public int getCode() {
		return this.code;
	}

	
}
