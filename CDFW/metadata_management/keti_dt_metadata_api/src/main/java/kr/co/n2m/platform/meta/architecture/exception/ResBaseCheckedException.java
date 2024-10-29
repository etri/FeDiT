package kr.co.n2m.platform.meta.architecture.exception;

import java.util.Collections;
import java.util.Map;

import org.springframework.core.NestedExceptionUtils;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.lang.Nullable;
import org.springframework.util.Assert;

/**
 * Base class for exceptions associated with specific HTTP response status codes.
 * 
 * ResponseStatusException 내용을 복사. (spring-web-5.3.24.jar 버전)
 * ResponseStatusException 는 RuntimeException 임.
 * 
 * @author  n2m
 */
@SuppressWarnings("serial")
public class ResBaseCheckedException extends Exception {
	
	private final int status;

	@Nullable
	private final String reason;
	
	
	public ResBaseCheckedException() {
		this(HttpStatus.INTERNAL_SERVER_ERROR, "서버에서 오류가 발생했습니다.");
	}
	
	public ResBaseCheckedException(HttpStatus status, @Nullable String reason) {
		super("");
		Assert.notNull(status, "HttpStatus is required");
		this.status = status.value();
		this.reason = reason;
	}

	public ResBaseCheckedException(HttpStatus status, @Nullable String reason, @Nullable Throwable cause) {
		super(null, cause);
		Assert.notNull(status, "HttpStatus is required");
		this.status = status.value();
		this.reason = reason;
	}

	public ResBaseCheckedException(int rawStatusCode, @Nullable String reason, @Nullable Throwable cause) {
		super(null, cause);
		this.status = rawStatusCode;
		this.reason = reason;
	}
	
	public ResBaseCheckedException(Throwable cause) {
		super(null, cause);
		this.status = HttpStatus.INTERNAL_SERVER_ERROR.value();
		this.reason = "서버에서 오류가 발생했습니다.";
	}

	/**
	 * Return the HTTP status associated with this exception.
	 * @throws IllegalArgumentException in case of an unknown HTTP status code
	 * @since #getRawStatusCode()
	 * @see HttpStatus#valueOf(int)
	 */
	public HttpStatus getStatus() {
		return HttpStatus.valueOf(this.status);
	}

	/**
	 * Return the HTTP status code (potentially non-standard and not resolvable
	 * through the {@link HttpStatus} enum) as an integer.
	 * @return the HTTP status as an integer value
	 * @since 5.3
	 * @see #getStatus()
	 * @see HttpStatus#resolve(int)
	 */
	public int getRawStatusCode() {
		return this.status;
	}

	/**
	 * Return headers associated with the exception that should be added to the
	 * error response, e.g. "Allow", "Accept", etc.
	 * <p>The default implementation in this class returns an empty map.
	 * @since 5.1.11
	 * @deprecated as of 5.1.13 in favor of {@link #getResponseHeaders()}
	 */
	@Deprecated
	public Map<String, String> getHeaders() {
		return Collections.emptyMap();
	}

	/**
	 * Return headers associated with the exception that should be added to the
	 * error response, e.g. "Allow", "Accept", etc.
	 * <p>The default implementation in this class returns empty headers.
	 * @since 5.1.13
	 */
	public HttpHeaders getResponseHeaders() {
		Map<String, String> headers = getHeaders();
		if (headers.isEmpty()) {
			return HttpHeaders.EMPTY;
		}
		HttpHeaders result = new HttpHeaders();
		getHeaders().forEach(result::add);
		return result;
	}

	/**
	 * The reason explaining the exception (potentially {@code null} or empty).
	 */
	@Nullable
	public String getReason() {
		return this.reason;
	}

	@Override
	public String getMessage() {
		HttpStatus code = HttpStatus.resolve(this.status);
		String msg = (code != null ? code : this.status) + (this.reason != null ? " \"" + this.reason + "\"" : "");
		return NestedExceptionUtils.buildMessage(msg, getCause());
	}
	
}
