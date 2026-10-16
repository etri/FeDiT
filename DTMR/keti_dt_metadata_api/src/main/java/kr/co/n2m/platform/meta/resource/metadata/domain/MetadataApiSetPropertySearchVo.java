package kr.co.n2m.platform.meta.resource.metadata.domain;

import java.io.Serializable;

import io.swagger.v3.oas.annotations.media.Schema;
import kr.co.n2m.platform.meta.architecture.domain.PageVo;
import kr.co.n2m.platform.meta.architecture.domain.SearchVo;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.Setter;

/**
 * 유형 모델별 메타데이터 프라퍼티 검색 Vo (외부 API용)
 * 
 * @author  n2m
 */
@Schema(description="유형 모델별 메타데이터 프라퍼티 검색 Vo (외부 API용)")
@Getter
@Setter
public class MetadataApiSetPropertySearchVo extends SearchVo implements Serializable {
	
	/** serialVersionUID */
	private static final long serialVersionUID = 2022L;
	
	@Schema(description="메타데이터 셋 ID")
	private String medataSetId;		
	
	@Schema(description="프라퍼티 명")
	private String prptyNm;
	
	@Schema(description="유형 모델 ID")
	private String typeModelId;	
	
	//@Getter(AccessLevel.NONE)
	@Schema(description="리소스 URL", hidden=true)
	private String resourceUrl;
	
	
	public MetadataApiSetPropertySearchVo() { /* default 생성자 */ }
	
	public MetadataApiSetPropertySearchVo(PageVo pageVo) {	
		super(pageVo);
	}

}
