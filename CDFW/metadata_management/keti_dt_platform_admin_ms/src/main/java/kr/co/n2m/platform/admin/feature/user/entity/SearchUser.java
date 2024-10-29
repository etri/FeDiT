package kr.co.n2m.platform.admin.feature.user.entity;

import org.apache.ibatis.type.Alias;

import io.swagger.annotations.ApiModelProperty;
import io.swagger.annotations.ApiParam;
import kr.co.n2m.platform.admin.feature.common.entity.SearchVO;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Alias("searchUserVo")
@Data
@EqualsAndHashCode(callSuper = false)
public class SearchUser extends SearchVO {
	 @ApiParam(hidden = true)
	 @ApiModelProperty(hidden = true)
	 private String searchWord;
}
