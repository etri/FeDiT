package kr.co.n2m.platform.meta.resource.category.domain;

import java.io.Serializable;

import org.apache.commons.lang3.builder.ReflectionToStringBuilder;
import org.apache.commons.lang3.builder.ToStringStyle;

import io.swagger.v3.oas.annotations.media.Schema;
import kr.co.n2m.platform.meta.architecture.domain.SearchVo;
import lombok.Getter;
import lombok.Setter;

/**
 * 대리인의 검색 parameter Vo
 * 
 * @author  n2m
 */
@Schema(description="카테고리 검색 parameter Vo")
@Getter
@Setter
public class CategorySearchVo extends SearchVo implements Serializable {
	
	/** serialVersionUID */
	private static final long serialVersionUID = 2022L;
	
	@Schema(description="카테고리 데이터 상태 메타코드")
	private String ctgryDataSttusMtcd;
	@Schema(description="카테고리명")
	private String ctgryNm;
	@Schema(description="카테고리 RDF 개념 명")
	private String ctgryRdfCncptNm;
	@Schema(description="상위 카테고리 ID")
	private String upCtgryId;
	@Schema(description="카테고리 ID")
	private String ctgryId;
	@Schema(description="카테고리 매핑코드")
	private String ctgryMappgCd;
	@Schema(description="상위 카테고리명")
	private String upCtgryNm;
	
	@Schema(description="수정일 검색기간 시작일")
	private String srchStartDd;
	@Schema(description="수정일 검색기간 종료일")
	private String srchEndDd;
	
	@Override
	public String toString() {
		return ReflectionToStringBuilder.toString(this, ToStringStyle.SHORT_PREFIX_STYLE, true, true);
	}
}
