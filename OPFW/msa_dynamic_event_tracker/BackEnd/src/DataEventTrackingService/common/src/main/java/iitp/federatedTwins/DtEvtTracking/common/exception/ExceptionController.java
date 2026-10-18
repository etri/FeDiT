package iitp.federatedTwins.DtEvtTracking.common.exception;

import java.nio.file.AccessDeniedException;
import java.util.HashMap;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.servlet.NoHandlerFoundException;

import iitp.federatedTwins.DtEvtTracking.common.util.Constant;

@ControllerAdvice
public class ExceptionController {
	private final Logger logger = LoggerFactory.getLogger(ExceptionController.class);

	@ExceptionHandler({ RuntimeException.class })
	public ResponseEntity<HashMap<String, Object>> BadRequestException(RuntimeException e) {
		HttpHeaders httpHeaders = new HttpHeaders();
		httpHeaders.add("Content-Type", "application/json;charset=UTF-8");

		logger.error("Error Message : {} "+ e);

		HashMap<String, Object> resultMap = new HashMap<>();
		resultMap.put("statusCode", Constant.HTTP_BAD_REQ_ERROR_CODE);
		resultMap.put("httpStatus", Constant.HTTP_BAD_REQ_ERROR_STAT);
		return new ResponseEntity<>(resultMap, httpHeaders, Constant.HTTP_BAD_REQ_ERROR_STAT);
	}

	@ExceptionHandler({ AccessDeniedException.class })
	public ResponseEntity<HashMap<String, Object>> handleAccessDeniedException(final AccessDeniedException e) {
		HttpHeaders httpHeaders = new HttpHeaders();
		httpHeaders.add("Content-Type", "application/json;charset=UTF-8");

		logger.error("Error Message : {} "+ e);

		HashMap<String, Object> resultMap = new HashMap<>();
		resultMap.put("statusCode", Constant.HTTP_AUTHORIZED_ERROR_CODE);
		resultMap.put("httpStatus", Constant.HTTP_AUTHORIZED_ERROR_STAT);
		return new ResponseEntity<>(resultMap, httpHeaders, Constant.HTTP_AUTHORIZED_ERROR_STAT);
	}

	@ExceptionHandler({ Exception.class })
	public ResponseEntity<HashMap<String, Object>> handleAll(Exception e) {
		HttpHeaders httpHeaders = new HttpHeaders();
		httpHeaders.add("Content-Type", "application/json;charset=UTF-8");

		logger.error("Error Message : {} "+ e);

		HashMap<String, Object> resultMap = new HashMap<>();
		resultMap.put("statusCode", Constant.HTTP_SERVER_ERROR_CODE);
		resultMap.put("httpStatus", Constant.HTTP_SERVER_ERROR_STAT);
		return new ResponseEntity<>(resultMap, httpHeaders, Constant.HTTP_SERVER_ERROR_STAT);
	}

	@ExceptionHandler(NoHandlerFoundException.class)
	public ResponseEntity<HashMap<String, Object>> handle404Error(NoHandlerFoundException e) {
		HttpHeaders httpHeaders = new HttpHeaders();
		httpHeaders.add("Content-Type", "application/json;charset=UTF-8");

		logger.error("Error Message : {} "+ e);

		HashMap<String, Object> resultMap = new HashMap<>();
		resultMap.put("statusCode", Constant.HTTP_NOT_FOUND_CODE);
		resultMap.put("httpStatus", Constant.HTTP_NOT_FOUND_STAT);
		return new ResponseEntity<>(resultMap, httpHeaders, Constant.HTTP_NOT_FOUND_STAT);
	}
}
