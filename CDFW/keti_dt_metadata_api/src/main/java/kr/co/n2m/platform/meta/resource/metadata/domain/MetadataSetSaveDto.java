package kr.co.n2m.platform.meta.resource.metadata.domain;

import org.apache.commons.lang3.builder.ReflectionToStringBuilder;
import org.apache.commons.lang3.builder.ToStringStyle;

import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.media.Schema.AccessMode;
import lombok.Getter;
import lombok.Setter;

/**
 * 메타데이터 셋 저장용 Dto
 * 
 * @author  n2m
 */
@Getter
@Setter
public class MetadataSetSaveDto extends MetadataSetVo {
	
	@Schema(description="연결 메타데이터 셋 ID (상위)", accessMode=AccessMode.WRITE_ONLY)
	private String cnctMedataSetId;
	
	@Schema(description="연결 프라퍼티 ID (상위)", accessMode=AccessMode.WRITE_ONLY)	
	private String cnctPrptyId;
	
	@Schema(description="식별체계 사용 여부")
	private String idSchmUseYn;
	
    @Override
    public String toString() {
        return ReflectionToStringBuilder.toString(this, ToStringStyle.SHORT_PREFIX_STYLE, true, true);
    }	
	
}
