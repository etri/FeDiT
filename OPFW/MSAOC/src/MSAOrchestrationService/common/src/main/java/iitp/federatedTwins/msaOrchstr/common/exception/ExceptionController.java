package iitp.federatedTwins.msaOrchstr.common.exception;

import java.nio.file.AccessDeniedException;
import java.util.HashMap;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.servlet.NoHandlerFoundException;

import iitp.federatedTwins.msaOrchstr.common.util.Constant;

@ControllerAdvice
public class ExceptionController {
	private final Logger logger = LoggerFactory.getLogger(ExceptionController.class);

	// 400
	@ExceptionHandler({ RuntimeException.class })
	public ResponseEntity<HashMap<String, Object>> BadRequestException(RuntimeException e) {
		HttpHeaders httpHeaders = new HttpHeaders();
		httpHeaders.add("Content-Type", "application/json;charset=UTF-8");

		logger.error("Error Message >>>>>>>>>>>>>" , e);

		HashMap<String, Object> resultMap = new HashMap<>();
		resultMap.put("statusCode", Constant.HTTP_BAD_REQ_ERROR_CODE);
		resultMap.put("httpStatus", Constant.HTTP_BAD_REQ_ERROR_STAT);
		return new ResponseEntity<>(resultMap, httpHeaders, Constant.HTTP_BAD_REQ_ERROR_STAT);
	}

	// 401
	@ExceptionHandler({ AccessDeniedException.class })
	public ResponseEntity<HashMap<String, Object>> handleAccessDeniedException(final AccessDeniedException e) {
		HttpHeaders httpHeaders = new HttpHeaders();
		httpHeaders.add("Content-Type", "application/json;charset=UTF-8");

		logger.error("Error Message >>>>>>>>>>>>>" , e);

		HashMap<String, Object> resultMap = new HashMap<>();
		resultMap.put("statusCode", Constant.HTTP_AUTHORIZED_ERROR_CODE);
		resultMap.put("httpStatus", Constant.HTTP_AUTHORIZED_ERROR_STAT);
		return new ResponseEntity<>(resultMap, httpHeaders, Constant.HTTP_AUTHORIZED_ERROR_STAT);
	}

	// 500
	@ExceptionHandler({ Exception.class })
	public ResponseEntity<HashMap<String, Object>> handleAll(Exception e) {
		HttpHeaders httpHeaders = new HttpHeaders();
		httpHeaders.add("Content-Type", "application/json;charset=UTF-8");

		logger.error("Error Message >>>>>>>>>>>>>" , e);

		HashMap<String, Object> resultMap = new HashMap<>();
		resultMap.put("statusCode", Constant.HTTP_SERVER_ERROR_CODE);
		resultMap.put("httpStatus", Constant.HTTP_SERVER_ERROR_STAT);
		return new ResponseEntity<>(resultMap, httpHeaders, Constant.HTTP_SERVER_ERROR_STAT);
	}

	// 404
	@ExceptionHandler(NoHandlerFoundException.class)
	public ResponseEntity<HashMap<String, Object>> handle404Error(NoHandlerFoundException e) {
		HttpHeaders httpHeaders = new HttpHeaders();
		httpHeaders.add("Content-Type", "application/json;charset=UTF-8");

		logger.error("Error Message >>>>>>>>>>>>>" , e);

		HashMap<String, Object> resultMap = new HashMap<>();
		resultMap.put("statusCode", Constant.HTTP_NOT_FOUND_CODE);
		resultMap.put("httpStatus", Constant.HTTP_NOT_FOUND_STAT);
		return new ResponseEntity<>(resultMap, httpHeaders, Constant.HTTP_NOT_FOUND_STAT);
	}
}
