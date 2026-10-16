package kr.co.n2m.platform.admin.feature.platform.entity;

import io.swagger.annotations.ApiModelProperty;
import io.swagger.annotations.ApiParam;
import kr.co.n2m.platform.admin.feature.common.entity.SearchVO;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = false)
public class SearchPlatform extends SearchVO {

	private static final long serialVersionUID = -2523780397789750036L;

	/** 검색 조건. */
	@ApiParam(hidden= true)
	@ApiModelProperty(hidden = true)
	private String searchWord;
	
	@ApiParam(hidden= true)
	@ApiModelProperty(hidden = true)
	private String searchType;

}
