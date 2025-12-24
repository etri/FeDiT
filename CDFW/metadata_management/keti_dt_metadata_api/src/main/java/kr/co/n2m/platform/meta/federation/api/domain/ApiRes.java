package kr.co.n2m.platform.meta.federation.api.domain;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;

import org.apache.commons.lang3.StringUtils;
import org.springframework.util.Assert;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.Setter;

/**
 * API 응답 
 * 
 * @author  n2m
 */
@Getter
@Setter
public class ApiRes {
	
	@Schema(description="응답 코드", defaultValue="0")
	private int responseCode = 0;
	
	@Schema(description="응답 메세지", defaultValue="")
	private String responseMsg = "";
	
	@Schema(description="목록 데이터 (Not Null. Empty List 가능)")
	private List<Object> responseData; // 무조건 List 데이터로 반환
	
	public ApiRes() { /* default 생성자 */ }
	
	public ApiRes(ApiResCode enumCode, Object data) {
		Assert.notNull(enumCode, "응답코드는 null일 수 없습니다.");
		this.responseCode = enumCode.code();
		this.responseMsg = enumCode.message();
		this.setResponseData(data);
	}
	
	public ApiRes(int resCode, Object data) {
		this.responseCode = resCode;
		this.responseMsg = ApiResCode.getMessageByCode(resCode);
		this.setResponseData(data);
	}
	
	public ApiRes(ApiResCode enumCode, Object data, String detailMsg) {
		Assert.notNull(enumCode, "응답코드는 null일 수 없습니다.");
		this.responseCode = enumCode.code();
		this.responseMsg = enumCode.message() + (StringUtils.isNoneBlank(detailMsg) ? " - " + detailMsg : "");
		this.setResponseData(data);
	}
	
	public ApiRes(int resCode, Object data, String detailMsg) {
		this.responseCode = resCode;
		this.responseMsg = ApiResCode.getMessageByCode(resCode) + (StringUtils.isNoneBlank(detailMsg) ? " - " + detailMsg : "");
		this.setResponseData(data);
	}
	
	@SuppressWarnings("unchecked")
	public void setResponseData(Object obj) {
	    if (obj == null) {
	    	this.responseData = Collections.emptyList();
	    } else if (obj instanceof List) {
	    	this.responseData = (List<Object>) obj;
	    } else if (obj.getClass().isArray()) {
	    	this.responseData = (List<Object>) Arrays.asList((Object[]) obj); // 배열을 List로 변환
	    } else {
	    	this.responseData = Collections.singletonList(obj); // 단일 객체를 List에 감싸기
	    }
	}
	
    public static ApiRes of(ApiResCode enumCode, Object data) {
        return new ApiRes(enumCode, data);
    }
	
    public static ApiRes of(int resCode, Object data) {
        return new ApiRes(resCode, data);
    }	
	
    public static ApiRes of(ApiResCode enumCode, Object data, String detailMsg) {
        return new ApiRes(enumCode, data, detailMsg);
    }
	
    public static ApiRes of(int resCode, Object data, String detailMsg) {
        return new ApiRes(resCode, data, detailMsg);
    }
    
}
