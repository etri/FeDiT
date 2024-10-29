package kr.co.n2m.platform.admin.feature.group.entity;

import io.swagger.annotations.ApiModelProperty;
import io.swagger.annotations.ApiParam;
import kr.co.n2m.platform.admin.feature.common.entity.SearchVO;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = false)
public class SearchGroup extends SearchVO {

	 @ApiParam(hidden = true)
	 @ApiModelProperty(hidden = true)
	 private String searchGrpNm;
	 
	 @ApiParam(hidden = true)
	 @ApiModelProperty(hidden = true)
	 private String searchType;
	 
	 @ApiParam(hidden = true)
	 @ApiModelProperty(hidden = true)
	 private String searchWord;
	 
	// --------------------------------------------------
	 
	 @ApiParam(hidden = true)
	 @ApiModelProperty(hidden = true)
	 private String searchGrpId;

	 @ApiParam(hidden = true)
	 @ApiModelProperty(hidden = true)
	 private String searchUserId;
	 
}
