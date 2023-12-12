package kr.co.n2m.platform.meta.resource.metadata.domain;

import org.apache.commons.lang3.builder.ReflectionToStringBuilder;
import org.apache.commons.lang3.builder.ToStringStyle;

import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.media.Schema.AccessMode;
import kr.co.n2m.platform.meta.architecture.domain.BaseVo;
import lombok.Getter;
import lombok.Setter;

/**
 * 메타데이터 셋 정보 Vo
 * 
 * @author  n2m
 */
@Getter
@Setter
public class MetadataSetVo extends BaseVo {

	@Schema(description="메타데이터 셋 ID", accessMode=AccessMode.READ_ONLY)
	private String medataSetId;
	@Schema(description="메타데이터 모델 ID")
	private String modelId;
	@Schema(description="메타데이터 셋 명")
	private String medataSetNm;
	@Schema(description="메타데이터 셋 논리명(한글)")
	private String medataSetLogicNm;
	@Schema(description="메타데이터 셋 설명")
	private String medataSetDesc;
	@Schema(description="메타데이터 셋 상태 코드")
	private String medataSetSttusMtcd;
	@Schema(description="메타데이터 셋 상태 사유")
	private String medataSetSttusWhy;
	@Schema(description="최신 리비전", accessMode=AccessMode.READ_ONLY)
	private int medataSetNwstRvsn;
	
	@Schema(description="등록자 ID", accessMode=AccessMode.READ_ONLY)
	private String medataSetRegrId;
	@Schema(description="등록자 명", accessMode=AccessMode.READ_ONLY)
	private String medataSetRegrNm;
	@Schema(description="등록일시", accessMode=AccessMode.READ_ONLY)
	private String medataSetRegDt;
	@Schema(description="수정자 ID", accessMode=AccessMode.READ_ONLY)
	private String medataSetAmdrId;
	@Schema(description="수정자 명", accessMode=AccessMode.READ_ONLY)
	private String medataSetAmdrNm;
	@Schema(description="수정일시", accessMode=AccessMode.READ_ONLY)
	private String medataSetAmdDt;

    @Override
    public String toString() {
        return ReflectionToStringBuilder.toString(this, ToStringStyle.SHORT_PREFIX_STYLE, true, true);
    }	
    
}
