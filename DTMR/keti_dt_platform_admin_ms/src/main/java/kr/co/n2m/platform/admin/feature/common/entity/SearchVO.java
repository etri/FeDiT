package kr.co.n2m.platform.admin.feature.common.entity;

import org.apache.ibatis.type.Alias;
import org.springframework.beans.factory.annotation.Value;

import io.swagger.annotations.ApiModelProperty;
import io.swagger.annotations.ApiParam;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Alias("searchVO")
@Data
@EqualsAndHashCode(callSuper = false)
public class SearchVO extends PagingVO {

	@ApiModelProperty(hidden = true)
	@ApiParam(hidden = true)
	private String searchRegSt;

	@ApiModelProperty(hidden = true)
	@ApiParam(hidden = true)
	private String searchRegEd;

	@ApiModelProperty(hidden = true)
	@ApiParam(hidden = true)
	private String searchAmdSt;

	@ApiModelProperty(hidden = true)
	@ApiParam(hidden = true)
	private String searchAmdEd;

	@ApiModelProperty(hidden = true) 
	@ApiParam(hidden = true)
	@Value("[]") 
	private int[] searchLimit;

	@ApiModelProperty(hidden = true)
	@ApiParam(hidden= true)
	private String loginUserId;

}
