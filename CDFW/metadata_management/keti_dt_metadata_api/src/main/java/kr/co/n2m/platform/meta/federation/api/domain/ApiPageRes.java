package kr.co.n2m.platform.meta.federation.api.domain;

import java.util.Collections;
import java.util.List;

import org.springframework.util.Assert;

import io.swagger.v3.oas.annotations.media.Schema;
import kr.co.n2m.platform.meta.architecture.domain.PageVo;
import lombok.Getter;
import lombok.Setter;

/**
 * API 응답 (페이징 정보 포함) 
 * 
 * @author  n2m
 */
@Getter
@Setter
public class ApiPageRes {
	
	@Schema(description="응답 코드", defaultValue="0")
	private int responseCode = 0;
	
	@Schema(description="응답 메세지", defaultValue="")
	private String responseMsg = "";
	
	@Schema(description="목록 데이터 (Not Null. Empty List 가능)")
	private List responseData;
	
	@Schema(description="페이지 정보")
	PageVo pageInfo;
	
	public ApiPageRes() { /* default 생성자 */ }
	
	public ApiPageRes(ApiResCode enumCode, List list, PageVo page) {
		Assert.notNull(enumCode, "응답코드는 null일 수 없습니다.");
		this.responseCode = enumCode.code();
		this.responseMsg = enumCode.message();
		this.setResponseData(list);
		this.pageInfo = page;
	}
	
	public ApiPageRes(int resCode, List list, PageVo page) {
		this.responseCode = resCode;
		this.responseMsg = ApiResCode.getMessageByCode(resCode);
		this.setResponseData(list);
		this.pageInfo = page;
	}

	public void setResponseData(List list) {
		this.responseData = (list == null) ? Collections.emptyList() : list;
	}
	
	public void setPageInfo(PageVo page) {
		this.pageInfo = (page == null) ? new PageVo() : page;
 	}
	
    public static ApiPageRes of(ApiResCode enumCode, List list, PageVo page) {
        return new ApiPageRes(enumCode, list, page);
    }
	
    public static ApiPageRes of(int resCode, List list, PageVo page) {
        return new ApiPageRes(resCode, list, page);
    }
    
}
