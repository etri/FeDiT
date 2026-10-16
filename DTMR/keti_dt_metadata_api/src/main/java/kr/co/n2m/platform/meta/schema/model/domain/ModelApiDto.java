package kr.co.n2m.platform.meta.schema.model.domain;

import java.io.Serializable;
import java.util.List;

import org.apache.commons.lang3.builder.ReflectionToStringBuilder;
import org.apache.commons.lang3.builder.ToStringStyle;

import io.swagger.v3.oas.annotations.media.Schema;
import kr.co.n2m.platform.meta.schema.modelproperty.domain.ModelPropertyApiDto;
import lombok.Getter;
import lombok.Setter;

@Schema(description="메타데이터 모델 정보 Dto (외부 API용)")
@Getter
@Setter
public class ModelApiDto implements Serializable {
	
	/** serialVersionUID */
	private static final long serialVersionUID = 2022L;

	@Schema(description="메타데이터 모델 명")
	private String metaModel;
	@Schema(description="메타데이터 모델 명 (=metaModel)")
	private String modelNm;
	@Schema(description="메타데이터 모델 논리명")	
	private String modelLogicNm;
	@Schema(description="메타데이터 모델 설명")		
	private String modelDesc;
	
	@Schema(description="메타데이터 유형 명")	
	private String typeModelNm;	
	@Schema(description="메타데이터 유형 논리명")	
	private String typeModelLogicNm;	
	
	@Schema(description="메타데이터 상위 모델 명")	
	private String upModelNm;
	@Schema(description="메타데이터 상위 모델 논리명")	
	private String upModelLogicNm;
	
	@Schema(description="프라퍼티 목록")
	private List<String> properties;

	@Schema(description="프라퍼티 정보 목록")	
	private List<ModelPropertyApiDto> propertyInfos;
	
    @Override
    public String toString() {
        return ReflectionToStringBuilder.toString(this, ToStringStyle.SHORT_PREFIX_STYLE, true, true);
    }
    
}
