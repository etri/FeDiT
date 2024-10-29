package kr.co.n2m.platform.meta.architecture.domain;

import javax.annotation.Nullable;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.Setter;

/**
 * 데이터 응답 
 * 
 * @author  n2m
 */
@Getter
@Setter
public class DataRes<T> {
	
	// 실패/에러인 경우는 Exception 처리. 성공인 경우만 이 응답이 갈 듯.	
	public static final String SUCCESS = "SUCCESS";
	//public static final String FAIL    = "FAIL";
	public static final String PARTIAL_SUCCESS = "PARTIAL_SUCCESS"; // 부분 성공
	
	@Schema(description="응답 코드", defaultValue="SUCCESS")
	private String responseCode = SUCCESS;
	
	@Schema(description="응답 메세지", defaultValue="정상적으로 처리되었습니다.")
	private String responseMsg  = "정상적으로 처리되었습니다.";
	
	@Schema(description="데이터 (Null 가능)")
	private @Nullable T data;
	
	public DataRes() { /* default 생성자 */ }
	
	public DataRes(T data) {	
		this.data = data;
	}
	
}
