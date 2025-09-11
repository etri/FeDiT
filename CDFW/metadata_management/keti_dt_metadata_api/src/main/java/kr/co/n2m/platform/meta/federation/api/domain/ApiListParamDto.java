package kr.co.n2m.platform.meta.federation.api.domain;

import java.io.Serializable;

import io.swagger.v3.oas.annotations.media.Schema;
import kr.co.n2m.platform.meta.architecture.domain.PageVo;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ApiListParamDto extends PageVo implements Serializable {
	
	/** serialVersionUID */
	private static final long serialVersionUID = 2025L;
	
	@Schema(description="배열 데이터 조회 제한 건수", defaultValue="20")
	private int arrayDataLimit = 20;
	
	@Schema(description="object 참조 형식 : none/id/object", defaultValue="none")
	private String objectRefFormat = "none";
	
	public ApiListParamDto() { /* default 생성자 */ }
	
	public ApiListParamDto(PageVo pageVo) {	
		super(pageVo);
	}
	
}
