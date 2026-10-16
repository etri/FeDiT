package kr.co.n2m.platform.meta.resource.metadata.domain;

import java.io.Serializable;

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
public class MetadataSearchVo extends SearchVo implements Serializable {
	
	/** serialVersionUID */
	private static final long serialVersionUID = 2022L;

	@Schema(description="검색어 (메타데이터 셋 물리명 또는 논리명)")
	private String srchText;
	@Schema(description="메타데이터 셋 ID")
	private String medataSetId;	
	@Schema(description="모델 ID")
	private String modelId;
	@Schema(description="검색어 (모델 명)")
	private String srchModelNm;
	@Schema(description="메타데이터 셋 상태")
	private String medataSetSttusMtcd;		
	@Schema(description="메타데이터 셋 등록자 ID")
	private String medataSetRegrId;	
	
	@Schema(description="유형 모델 ID")
	private String typeModelId;
	
	@Schema(description="키워드")
	private String keyword;	
	@Schema(description="대리인(제공자) ID")
	private String agntId;
	@Schema(description="카테고리 ID")
	private String ctgryId;

	@Schema(description="검색어 (메타데이터 값)")
	private String srchVal;	
	@Schema(description="메타데이터 ID")
	private String medataId;	
	@Schema(description="프라퍼티 ID")
	private String prptyId;
	@Schema(description="값 모델 ID")
	private String valModelId;	
	@Schema(description="메타데이터 값")
	private String medataVal;
	@Schema(description="언어 코드")
	private String langMtcd;	
	
	@Schema(description="메타데이터 셋 내용과 같은 특수 프라퍼티만 조회 여부")
	private String onlyMetadataSetYn;
	
	@Schema(description="메타데이터 셋 내용과 같은 특수 프라퍼티 제외 여부")
	private String exceptForMetadataSetYn;

	@Schema(description="Json 데이터 제외 여부")
	private String exceptForJsonYn;
	
	@Schema(description="개수 프라퍼티 여부")
	private String cntPrptyYn;
	
	@Schema(description="프라퍼티 데이터 배열 여부")
	private String prptyDataArrayYn;
	
	//@Getter(AccessLevel.NONE)
	@Schema(description="리소스 URL", hidden=true)
	private String resourceUrl;
	
	@Schema(description="수정일 검색기간 시작일")
	private String srchStartDd;
	@Schema(description="수정일 검색기간 종료일")
	private String srchEndDd;
	
	@Schema(description="object_type 프라퍼티만 조회 여부")
	private String onlyObjectTypeYn;

	@Schema(description="제외(폐기) 상태 데이터 포함 여부 (Y/N). 기본 N — 폐기 데이터 검색 결과에 미포함.")
	private String includeDisuseYn;
	
	@Override
	public String toString() {
		return ReflectionToStringBuilder.toString(this, ToStringStyle.SHORT_PREFIX_STYLE, true, true);
	}

	@Schema(hidden=true, accessMode=AccessMode.READ_ONLY)
	public boolean getIsDataAllSearch() {
		if (StringUtils.isNotEmpty(keyword)) return true;
		if (StringUtils.isNotEmpty(agntId)) return true;
		if (StringUtils.isNotEmpty(ctgryId)) return true;
		
		if (StringUtils.isNotEmpty(srchVal)) return true;
		if (StringUtils.isNotEmpty(medataId)) return true;
		if (StringUtils.isNotEmpty(prptyId)) return true;
		if (StringUtils.isNotEmpty(valModelId)) return true;
		if (StringUtils.isNotEmpty(medataVal)) return true;
		if (StringUtils.isNotEmpty(langMtcd)) return true;
		if (StringUtils.isNotEmpty(onlyMetadataSetYn)) return true;
		if (StringUtils.isNotEmpty(exceptForMetadataSetYn)) return true;
		return false;
	}
	
}
