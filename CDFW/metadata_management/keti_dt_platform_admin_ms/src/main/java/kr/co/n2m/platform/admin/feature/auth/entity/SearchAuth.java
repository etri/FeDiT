package kr.co.n2m.platform.admin.feature.auth.entity;

import io.swagger.annotations.ApiModelProperty;
import io.swagger.annotations.ApiParam;
import kr.co.n2m.platform.admin.feature.common.entity.SearchVO;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = false)
public class SearchAuth extends SearchVO {
	
	private static final long serialVersionUID = 1L;

    /** The search aut name. */
	 @ApiParam(hidden = true)
	 @ApiModelProperty(hidden = true)
	 private String searchAutNm;

	/** The search aut yn. */
	 @ApiParam(hidden = true)
	 @ApiModelProperty(hidden = true)
	 private String searchUseYn;

	 @ApiParam(hidden = true)
	 @ApiModelProperty(hidden = true)
	 private String searchType;
	 
	 @ApiParam(hidden = true)
	 @ApiModelProperty(hidden = true)
	 private String searchWord;
	 
	// --------------------------------------------------
	 
	 @ApiParam(hidden = true)
	 @ApiModelProperty(hidden = true)
	 private String searchAuthOid;

	 @ApiParam(hidden = true)
	 @ApiModelProperty(hidden = true)
	 private String searchMenuOid;

	 @ApiParam(hidden = true)
	 @ApiModelProperty(hidden = true)
	 private String searchUserOid;
	 
	 @ApiParam(hidden = true)
	 @ApiModelProperty(hidden = true)
	 private String MenuOid;
	 
}
