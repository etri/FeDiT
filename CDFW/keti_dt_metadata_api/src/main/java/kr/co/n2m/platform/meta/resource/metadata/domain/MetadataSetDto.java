package kr.co.n2m.platform.meta.resource.metadata.domain;

import org.apache.commons.lang3.builder.ReflectionToStringBuilder;
import org.apache.commons.lang3.builder.ToStringStyle;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.Setter;

/**
 * 메타데이터 셋 조회 정보 Vo
 * 
 * @author  n2m
 */
@Getter
@Setter
public class MetadataSetDto extends MetadataSetVo {

	private String modelNm;
	private String modelLogicNm;
	
	private String typeModelId;
	private String typeModelNm;
	private String typeModelLogicNm;
	
	private String medataSetSttusMtcdNm;
	
	private int retvNum; // TODO : 추후 수정 혹은 삭제 필요
	
	@Schema(description="배열 데이터 조회 제한 여부", defaultValue="Y")
	private String arrayDataLimitYn = "Y";
	
	@Schema(description="배열 데이터 조회 제한 건수", defaultValue="10")
	private int arrayDataLimit = 10;
	
	public void setArrayDataLimitYn(String limitYn) {
		if (limitYn != null && !limitYn.isBlank()) {
			this.arrayDataLimitYn = limitYn;
		}
	}
	
	public void setArrayDataLimit(Integer limit) {
		if (limit != null && limit >= 0) {
			this.arrayDataLimit = limit;
		}
	}
	
    @Override
    public String toString() {
        return ReflectionToStringBuilder.toString(this, ToStringStyle.SHORT_PREFIX_STYLE, true, true);
    }
    
}
