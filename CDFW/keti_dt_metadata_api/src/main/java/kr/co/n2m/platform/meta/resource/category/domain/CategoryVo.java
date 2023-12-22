package kr.co.n2m.platform.meta.resource.category.domain;

import org.apache.commons.lang3.builder.ReflectionToStringBuilder;
import org.apache.commons.lang3.builder.ToStringStyle;
import org.apache.ibatis.type.Alias;

import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.media.Schema.AccessMode;
import kr.co.n2m.platform.meta.architecture.domain.BaseVo;
import lombok.Getter;
import lombok.Setter;

/**
 * 카테고리의 테이블 기본 정보 Vo
 * 
 * @author  n2m
 */
@Schema(description="카테고리의 테이블 기본 정보 Vo")
@Getter
@Setter
@Alias("categoryVo")
public class CategoryVo extends BaseVo {
	
	@Schema(description="카테고리 ID")
	private String ctgryId;
	@Schema(description="상위 카테고리 ID")
	private String upCtgryId;
	@Schema(description="상위 카테고리명")
	private String upCtgryNm;
	@Schema(description="상위 카테고리 RDF 개념 명")
	private String upCtgryRdfCncptNm;
	@Schema(description="카테고리 명")
	private String ctgryNm;
	@Schema(description="카테고리 RDF 개념 명")
	private String ctgryRdfCncptNm;
	@Schema(description="카테고리 데이터 상태 메타코드")
	private String ctgryDataSttusMtcd;
	@Schema(description="카테고리 데이터 상태 메타코드명")
	private String ctgryDataSttusMtcdNm;
	@Schema(description="카테고리 정렬 순서")
	private Integer ctgrySortOdrg;
	@Schema(description="카테고리 설명")
	private String ctgryDesc;
	@Schema(description="카테고리 영문 명")
	private String ctgryEngNm;
	@Schema(description="카테고리 영문 설명")
	private String ctgryEngDesc;
	@Schema(description="카테고리 매핑 코드")
	private String ctgryMappgCd;	
	@Schema(description="국가 코드")
	private String cntryCd;
	@Schema(description="카테고리 유형 메타코드")
	private String ctgryTypeMtcd;
	@Schema(description="카테고리 등록자 ID", accessMode=AccessMode.READ_ONLY)
	private String ctgryRegrId;
	@Schema(description="카테고리 등록자 명", accessMode=AccessMode.READ_ONLY)
	private String ctgryRegrNm;
	@Schema(description="카테고리 등록 일시", accessMode=AccessMode.READ_ONLY)
	private String ctgryRegDt;
	@Schema(description="카테고리 수정자 ID", accessMode=AccessMode.READ_ONLY)
	private String ctgryAmdrId;
	@Schema(description="카테고리 수정자 명", accessMode=AccessMode.READ_ONLY)
	private String ctgryAmdrNm;
	@Schema(description="카테고리 수정 일시", accessMode=AccessMode.READ_ONLY)
	private String ctgryAmdDt;
	
	@Override
	public String toString() {
		return ReflectionToStringBuilder.toString(this, ToStringStyle.SHORT_PREFIX_STYLE, true, true);
	}
}
