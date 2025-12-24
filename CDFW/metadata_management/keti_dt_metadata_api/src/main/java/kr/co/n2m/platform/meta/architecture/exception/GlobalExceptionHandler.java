package kr.co.n2m.platform.meta.architecture.exception;

import java.util.Date;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.TimeZone;

import javax.servlet.http.HttpServletRequest;

import org.apache.commons.lang3.time.DateFormatUtils;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import kr.co.n2m.platform.meta.architecture.code.Constant;
import lombok.extern.slf4j.Slf4j;

/**
 * REST API 예외 처리
 * 
 * @author  n2m
 */
@Slf4j
@RestControllerAdvice
@Order(Ordered.HIGHEST_PRECEDENCE)
public class GlobalExceptionHandler {
	
	/**
	 * 오류 발생시 ResponseEntity 객체 반환
	 */
	public ResponseEntity<Object> getResponseEntity(HttpServletRequest request, HttpStatus status, Exception ex) {
		
		HttpHeaders headers = new HttpHeaders();
		headers.add("Content-Type", Constant.HTTP_MEDIA_TYPE__APPLICATION_JSON_VALUE);

		String message = "처리중 오류가 발생했습니다. 관리자에게 문의해 주십시오.";  // 보안을 위해 몇몇 Exception의 내용만 보여줌.
		if (ex instanceof ResBaseRuntimeException) {
			message = ((ResBaseRuntimeException) ex).getReason();
		} else if (ex instanceof ResBaseCheckedException) {
			message = ((ResBaseCheckedException) ex).getReason();
		}
		
		Map<String, Object> body = new LinkedHashMap<>();
		body.put("timestamp", DateFormatUtils.format(new Date(), "yyyy-MM-dd HH:mm:ss.SSSXXX", TimeZone.getDefault())); // DateFormatUtils 에서는 XXX 까지만 허용함. XXXXX 출력 포맷 경우만
		body.put("status"   , status.value());
		body.put("error"    , status.getReasonPhrase());
		body.put("message"  , message);		
		body.put("exception", ex.getClass().getSimpleName());
		body.put("path"     , request.getRequestURI());
		
		//log.error(status.toString());  
		log.error(body.toString());
		
		return new ResponseEntity<>(body, headers, status);
	}
	
	/**
	 * 400, 401, 403, 404, 422, 500 관련 오류. RuntimeException.
	 */
	@ExceptionHandler(ResBaseRuntimeException.class)
	public ResponseEntity<Object> handleResponseStatusException(HttpServletRequest request, ResBaseRuntimeException ex) {
		return getResponseEntity(request, ex.getStatus(), ex);
	}		

	/**
	 * 500 관련 오류. CheckedException.
	 */
	@ExceptionHandler(ResBaseCheckedException.class)
	public ResponseEntity<Object> handleResponseStatusException(HttpServletRequest request, ResBaseCheckedException ex) {
		return getResponseEntity(request, ex.getStatus(), ex);
	}	
		
	/** 
	 * 그 외 Exception 은  500 오류
	 */
	@ExceptionHandler(Exception.class)
	public ResponseEntity<Object> handleTokenException(HttpServletRequest request, Exception ex) {
		return getResponseEntity(request, HttpStatus.INTERNAL_SERVER_ERROR, ex);
	}
	
}
