package kr.co.n2m.platform.meta.search.metadata.domain;

import java.io.Serializable;
import java.util.List;

import org.apache.commons.lang3.StringUtils;
import org.apache.commons.lang3.builder.ReflectionToStringBuilder;
import org.apache.commons.lang3.builder.ToStringStyle;

import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.media.Schema.AccessMode;
import kr.co.n2m.platform.meta.architecture.domain.SearchVo;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.Setter;

/**
 * 메타데이터 검색 Vo
 * 
 * @author  n2m
 */
@Schema(description="메타데이터 검색 Vo")
@Getter
@Setter
public class DataSearchVo extends SearchVo implements Serializable {
	
	/** serialVersionUID */
	private static final long serialVersionUID = 2022L;

	@Schema(description="디지털트윈 ID")
	private String digitalTwinId;
	
	@Schema(description="유형 모델 ID")
	private String typeModelId;
	
	@Schema(description="검색어 (메타데이터 셋 물리명 또는 논리명)")
	private String srchText;
	
	@Schema(description="키워드 유형")
	private String keywordType;
	
	@Schema(description="키워드")
	private String keyword;
	
	@Schema(description="공간")
	private String polygon;
	
	@Schema(description="메타데이터 셋 ID list")
	private List<String> medataSetIds;
	
	
}
