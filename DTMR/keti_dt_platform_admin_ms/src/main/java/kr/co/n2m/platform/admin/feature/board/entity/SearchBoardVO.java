package kr.co.n2m.platform.admin.feature.board.entity;

import org.apache.ibatis.type.Alias;

import io.swagger.annotations.ApiModelProperty;
import io.swagger.annotations.ApiParam;
import kr.co.n2m.platform.admin.feature.common.entity.SearchVO;
import lombok.Data;
import lombok.EqualsAndHashCode;

/**
* SearchCodeGroupVO
* @author (주)엔투엠
*/
@Alias("SearchBoardVO")
@Data
@EqualsAndHashCode(callSuper = false)
public class SearchBoardVO extends SearchVO {

	/** The Constant serialVersionUID. */
	private static final long serialVersionUID = -7647166942421505788L;

	/** 검색 조건. */
	@ApiModelProperty(hidden = true)
	@ApiParam(hidden= true)
	private String searchWord;

	@ApiModelProperty(hidden = true)
	@ApiParam(hidden= true)
	private String searchType;
	
}
