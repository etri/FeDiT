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
 * 메타데이터코드의 테이블 기본 정보 Vo
 * 
 * @author  n2m
 */
@Schema(description="메타데이터코드 테이블 기본 정보 Vo")
@Getter
@Setter
@Alias("codeVo")
public class CodeVo extends BaseVo {

	@Schema(description="메타코드그룹ID")
	private String mtcdGrpId;
	@Schema(description="메타코드")
	private String mtcd;
	@Schema(description="메타코드명")
	private String mtcdNm;
	@Schema(description="메타코드 사용여부")
	private String mtcdUseYn;
	@Schema(description="메타코드 정렬순서")
	private Integer mtcdSortOdrg;
	@Schema(description="메타코드 설명")
	private String mtcdDesc;
	@Schema(description="상위 메타코드")
	private String upMtcd;
	@Schema(description="메타코드 등록자 ID", accessMode=AccessMode.READ_ONLY)
	private String mtcdRegrId;
	@Schema(description="메타코드 등록자명", accessMode=AccessMode.READ_ONLY)
	private String mtcdRegrNm;
	@Schema(description="메타코드 등록일시", accessMode=AccessMode.READ_ONLY)
	private String mtcdRegDt;
	@Schema(description="메타코드 수정자 ID", accessMode=AccessMode.READ_ONLY)
	private String mtcdAmdrId;
	@Schema(description="메타코드 수정자명", accessMode=AccessMode.READ_ONLY)
	private String mtcdAmdrNm;
	@Schema(description="메타코드 수정일시", accessMode=AccessMode.READ_ONLY)
	private String mtcdAmdDt;
	
	@Override
	public String toString() {
		return ReflectionToStringBuilder.toString(this, ToStringStyle.SHORT_PREFIX_STYLE, true, true);
	}
}
