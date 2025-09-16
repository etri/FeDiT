package kr.co.n2m.platform.meta.search.vector.domain;

import java.io.Serializable;
import java.util.Map;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Schema(description="Vector 저장용 Dto")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class VectorStoreDto implements Serializable {
	
	/** serialVersionUID */
	private static final long serialVersionUID = 2022L;
	
	@Schema(description="메타데이터 셋 ID")
    private String medataSetId;
	
	@Schema(description="메타데이터 셋 명")
    private String medataSetNm;
    
    @Schema(description="메타데이터 셋 설명")
    private String medataSetDesc;
    
    @Schema(description="메타데이터 유형 모델 명")
    private String metaTypeModel;
    
    @Schema(description="메타데이터 모델 명")
    private String metaModel; // modelName
    
    @Schema(description="등록자 ID")
    private String medataSetRegrId;
    
    @Schema(description="등록일시")
	private String medataSetRegDt;
    
    @Schema(description="수정일시")
	private String medataSetAmdDt;
    
    @Schema(description="메타데이터 커스텀 필드")
    private Map<String, Object> customFields;
}
