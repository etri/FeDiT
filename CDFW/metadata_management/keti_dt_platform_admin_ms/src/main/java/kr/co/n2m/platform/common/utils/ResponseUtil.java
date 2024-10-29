package kr.co.n2m.platform.common.utils;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

public class ResponseUtil {
	/**
	 * 
	 * makeResponseEntity()
	 * 
	 * REST API HTTP 결과 객체 생성 메소드
	 * 
	 * @Author      : hk-lee
	 * @Date        : 2020. 06. 29
	 * @param obj
	 * @return
	 */
	public static ResponseEntity<Object> makeResponseEntity(){
		return makeResponseEntity(null, null, HttpStatus.OK); 
	}
	public static ResponseEntity<Object> makeResponseEntity(Object obj){
		return makeResponseEntity(obj, null, HttpStatus.OK); 
	}
	public static ResponseEntity<Object> makeResponseEntity(Object obj, HttpStatus status){
		if (status == HttpStatus.CREATED) {
			return makeResponseEntity(obj, status, null);
		}
		return makeResponseEntity(obj, null, status); 
	}
	
	/**
	 * <pre>HttpStatus.CREATED(201) 의 경우 생성 되는 고유 ID를 헤더(Location) 포함하여 반환</pre>
	 * @Author		: junyl
	 * @Date		: 2020. 6. 30.
	 * @param obj
	 * @param status
	 * @param location
	 * @return
	 */
	public static ResponseEntity<Object> makeResponseEntity(Object obj, HttpStatus status, String location){
		HttpHeaders headers = new HttpHeaders();
		if (!StringUtil.isEmpty(location)) {
			headers.add("Location", location);
		}
		return makeResponseEntity(obj, headers, HttpStatus.CREATED); 
	}
	public static ResponseEntity<Object> makeResponseEntity(Object obj, HttpHeaders headers, HttpStatus status){
		return new ResponseEntity<Object>(obj, headers, status); 
	}
}
