package kr.co.n2m.platform.admin.feature.faq.entity;

import javax.persistence.Transient;

import io.swagger.annotations.ApiModelProperty;
import io.swagger.annotations.ApiParam;
import kr.co.n2m.platform.admin.feature.common.entity.SearchVO;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = false)
public class SearchFaq extends SearchVO {
	
	private static final long serialVersionUID = -969806718504950570L;

	/** 검색 조건. */
	@ApiParam(hidden= true)
	@ApiModelProperty(hidden = true)
	private String searchWord;
	
	@ApiParam(hidden= true)
	@ApiModelProperty(hidden = true)
	private String searchType;
	
	@Transient
	private long fileCount;

}
