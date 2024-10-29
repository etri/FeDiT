package kr.co.n2m.platform.meta.architecture.component;

import org.apache.commons.lang3.StringUtils;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;

import kr.co.n2m.platform.meta.architecture.code.Constant;
import kr.co.n2m.platform.meta.architecture.exception.ResBadRequestException;

/**
 * REST API 응답 컴포넌트
 * 
 * @author  n2m
 */
@Component
public class ResponseComponent {
	
	public static final String NOT_MATCH_MSG = "요청한 Path (%s) 정보와 Body (%s) 는 일치하지 않습니다.";
	
	/**
	 * PUT 요청의 PathVariable ID 와 RequestBody의 요청 ID의 일치 여부 확인
	 * 
	 * @param pathId : @PathVariable 고유ID
	 * @param bodyId : @RequestBody 내의 고유 ID
	 */
	public static void compareUniqueId(String pathId, String bodyId) throws ResBadRequestException {
		if (!StringUtils.equals(pathId, bodyId)) {
			throw new ResBadRequestException(String.format(NOT_MATCH_MSG, pathId, bodyId));
		}
	}
	
	
	public static HttpHeaders getJsonTypeHeaders() {
		HttpHeaders headers = new HttpHeaders();
		headers.add("Content-Type", Constant.HTTP_MEDIA_TYPE__APPLICATION_JSON_UTF8_VALUE);
		return headers;
	}
		
	public static ResponseEntity<Object> makeResponseEntity(Object obj) {
		HttpHeaders headers = new HttpHeaders();
		return makeResponseEntity(obj, headers, HttpStatus.OK); 
	}
	
	public static ResponseEntity<Object> makeResponseEntity(Object obj, HttpStatus status) {
		HttpHeaders headers = new HttpHeaders();
		return makeResponseEntity(obj, headers, status); 
	}
	
	/**
	 * HttpStatus.CREATED(201) 의 경우 생성 되는 고유 ID를 헤더(Location) 포함하여 반환
	 */
	public static ResponseEntity<Object> makeResponseEntity(Object obj, HttpStatus status, String location) {
		HttpHeaders headers = new HttpHeaders();
		if (StringUtils.isNotBlank(location)) {
			headers.add("Location", location);
		}
		return makeResponseEntity(obj, headers, HttpStatus.CREATED);
	}	
	
	public static ResponseEntity<Object> makeResponseEntity(Object obj, HttpHeaders headers) {
		return makeResponseEntity(obj, headers, HttpStatus.OK); 
	}
	
	public static ResponseEntity<Object> makeResponseEntity(Object obj, HttpHeaders headers, HttpStatus status) {
		headers.add("Content-Type", Constant.HTTP_MEDIA_TYPE__APPLICATION_JSON_UTF8_VALUE);
		return new ResponseEntity<Object>(obj, headers, status); 
	}
	
}
