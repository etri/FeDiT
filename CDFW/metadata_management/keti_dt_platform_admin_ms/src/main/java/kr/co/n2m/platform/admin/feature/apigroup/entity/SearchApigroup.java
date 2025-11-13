package kr.co.n2m.platform.admin.feature.apigroup.entity;

import org.apache.ibatis.type.Alias;

import io.swagger.annotations.ApiModelProperty;
import io.swagger.annotations.ApiParam;
import kr.co.n2m.platform.admin.feature.common.entity.SearchVO;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Alias("searchApigroupVo")
@Data
@EqualsAndHashCode(callSuper = false)
public class SearchApigroup extends SearchVO {
	  
	/** The Constant serialVersionUID. */
	private static final long serialVersionUID = -1208882574584424637L;
	
	/** 검색 조건. */
	@ApiParam(hidden = true)
	@ApiModelProperty(hidden = true)
	private String searchType;
	
	@ApiParam(hidden = true)
	@ApiModelProperty(hidden = true)
	private String searchWord;
	
	/** API 그룹 상태. */
	@ApiParam(hidden = true)
	@ApiModelProperty(hidden = true)
	private String searchUseYn;
	
	/** API Object ID. */
	@ApiParam(hidden = true)
	@ApiModelProperty(hidden = true)
	private String searchApiOid;

	/** API 그룹 Object ID. */
	@ApiParam(hidden = true)
	@ApiModelProperty(hidden = true)
	private String searchGrpOid;

}
