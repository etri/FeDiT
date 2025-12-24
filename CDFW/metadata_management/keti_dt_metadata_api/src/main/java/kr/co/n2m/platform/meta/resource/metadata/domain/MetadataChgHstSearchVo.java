package kr.co.n2m.platform.meta.resource.metadata.domain;

import java.io.Serializable;

import org.apache.commons.lang3.builder.ReflectionToStringBuilder;
import org.apache.commons.lang3.builder.ToStringStyle;

import io.swagger.v3.oas.annotations.media.Schema;
import kr.co.n2m.platform.meta.architecture.domain.SearchVo;
import lombok.Getter;
import lombok.Setter;

/**
 * 메타데이터 변경 이력 검색 Vo
 * 
 * @author  n2m
 */
@Schema(description="메타데이터 변경 이력 검색 Vo")
@Getter
@Setter
public class MetadataChgHstSearchVo extends SearchVo implements Serializable {
	
	/** serialVersionUID */
	private static final long serialVersionUID = 2022L;

	@Schema(description="메타데이터 셋 ID")
	private String medataSetId;	
	
	@Schema(description="프라퍼티 명 검색어 (물리명 또는 논리명)")
	private String srchPrptyNm;
	
	@Schema(description="리비전")
	private Integer chgAftrRvsn;

	@Override
	public String toString() {
		return ReflectionToStringBuilder.toString(this, ToStringStyle.SHORT_PREFIX_STYLE, true, true);
	}
	
}
