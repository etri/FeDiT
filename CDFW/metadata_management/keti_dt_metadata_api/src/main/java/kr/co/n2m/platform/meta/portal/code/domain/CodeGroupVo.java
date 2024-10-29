package kr.co.n2m.platform.meta.portal.code.domain;

import org.apache.commons.lang3.builder.ReflectionToStringBuilder;
import org.apache.commons.lang3.builder.ToStringStyle;
import org.apache.ibatis.type.Alias;

import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.media.Schema.AccessMode;
import kr.co.n2m.platform.meta.architecture.domain.BaseVo;
import lombok.Getter;
import lombok.Setter;

/**
 * 메타데이터코드그룹의 테이블 기본 정보 Vo
 * 
 * @author  n2m
 */
@Schema(description="메타데이터코드그룹의 테이블 기본 정보 Vo")
@Getter
@Setter
@Alias("codeGroupVo")
public class CodeGroupVo extends BaseVo {
	
	@Schema(description="메타코드그룹ID")
	private String mtcdGrpId;
	@Schema(description="메타코드그룹명")
	private String mtcdGrpNm;
	@Schema(description="메타코드그룹 사용여부")
	private String mtcdGrpUseYn;
	@Schema(description="메타코드그룹 설명")
	private String mtcdGrpDesc;
	@Schema(description="상위 메타코드그룹ID")
	private String upMtcdGrpId;
	@Schema(description="메타코드그룹 시스템용 여부")
	private String mtcdGrpSysUsgYn;
	@Schema(description="메타코드그룹 등록자ID", accessMode=AccessMode.READ_ONLY)
	private String mtcdGrpRegrId;
	@Schema(description="메타코드그룹 등록자명", accessMode=AccessMode.READ_ONLY)
	private String mtcdGrpRegrNm;
	@Schema(description="메타코드그룹 등록일시", accessMode=AccessMode.READ_ONLY)
	private String mtcdGrpRegDt;
	@Schema(description="메타코드그룹 수정자ID", accessMode=AccessMode.READ_ONLY)
	private String mtcdGrpAmdrId;
	@Schema(description="메타코드그룹 수정자명", accessMode=AccessMode.READ_ONLY)
	private String mtcdGrpAmdrNm;
	@Schema(description="메타코드그룹 수정일시", accessMode=AccessMode.READ_ONLY)
	private String mtcdGrpAmdDt;
	
	@Override
	public String toString() {
		return ReflectionToStringBuilder.toString(this, ToStringStyle.SHORT_PREFIX_STYLE, true, true);
	}
}
