package kr.co.n2m.platform.admin.feature.menu.entity;

import org.apache.ibatis.type.Alias;

import io.swagger.annotations.ApiModelProperty;
import io.swagger.annotations.ApiParam;
import kr.co.n2m.platform.admin.feature.common.entity.SearchVO;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Alias("searchMenuVo")
@Data
@EqualsAndHashCode(callSuper = false)
public class SearchMenu extends SearchVO {
	
	/** The Constant serialVersionUID. */
    private static final long serialVersionUID = -8241074431569427852L;
	
	/** 검색 조건. */
	@ApiModelProperty(notes="검색 조건")
	@ApiParam(value = "검색 조건")
	private String searchType;
}