package kr.co.n2m.platform.admin.feature.qna.entity;

import javax.persistence.Transient;

import io.swagger.annotations.ApiModelProperty;
import io.swagger.annotations.ApiParam;
import kr.co.n2m.platform.admin.feature.common.entity.SearchVO;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = false)
public class SearchQna extends SearchVO {

	private static final long serialVersionUID = -7509443037760899333L;

	/** 검색 조건. */
	@ApiParam(hidden= true)
	@ApiModelProperty(hidden = true)
	private String searchWord;
	
	@ApiParam(hidden= true)
	@ApiModelProperty(hidden = true)
	private String searchType;
	
	@Transient
	private long fileCount;
	
	/** CODE NM 조회. */
	@Transient
	private String cdNm;
}
