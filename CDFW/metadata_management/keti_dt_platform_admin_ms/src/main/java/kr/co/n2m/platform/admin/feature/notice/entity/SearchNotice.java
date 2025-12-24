package kr.co.n2m.platform.admin.feature.notice.entity;

import javax.persistence.Transient;

import io.swagger.annotations.ApiModelProperty;
import io.swagger.annotations.ApiParam;
import kr.co.n2m.platform.admin.feature.common.entity.SearchVO;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = false)
public class SearchNotice extends SearchVO {
	
	private static final long serialVersionUID = -4989293696284523875L;
	
	/** 검색 조건. */
	@ApiParam(hidden= true)
	@ApiModelProperty(hidden = true)
	private String searchWord;
	
	@ApiParam(hidden= true)
	@ApiModelProperty(hidden = true)
	private String searchType;
	
	@Transient
	private long fileCount;
	
	/** 첨부 파일 정보. */
	@Transient
	private String atcOid;

	@Transient
	private String contsOid;

	@Transient
	private String fileOriginNm;
	
	@Transient
	private String fileRestoNm;
	
	@Transient
	private String fileRestoPath;
	
	@Transient
	private long fileSize;

}
