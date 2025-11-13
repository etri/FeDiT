package kr.co.n2m.platform.meta.portal.code.domain;

import java.io.Serializable;

import org.apache.commons.lang3.builder.ReflectionToStringBuilder;
import org.apache.commons.lang3.builder.ToStringStyle;

import io.swagger.v3.oas.annotations.media.Schema;
import kr.co.n2m.platform.meta.architecture.domain.SearchVo;
import lombok.Getter;
import lombok.Setter;

/**
 * 메타데이터코드그룹의 검색 parameter Vo
 * 
 * @author  n2m
 */
@Schema(description="메타데이터코드그룹 검색 parameter Vo")
@Getter
@Setter
public class CodeSearchVo extends SearchVo implements Serializable {

	/** serialVersionUID */
	private static final long serialVersionUID = 2022L;
	
	@Schema(description="메타코드그룹ID")
	private String mtcdGrpId;
	@Schema(description="메타코드그룹명")
	private String mtcdGrpNm;
	@Schema(description="메타코드그룹 사용여부")
	private String mtcdGrpUseYn;
	@Schema(description="상위 메타코드 그룹 ID")
	private String upMtcdGrpId;
	
	@Schema(description="메타코드")
	private String mtcd;
	@Schema(description="메타코드명")
	private String mtcdNm;
	@Schema(description="메타코드 사용여부")
	private String mtcdUseYn;
	
	@Override
	public String toString() {
		return ReflectionToStringBuilder.toString(this, ToStringStyle.SHORT_PREFIX_STYLE, true, true);
	}
}
