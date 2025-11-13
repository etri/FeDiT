package kr.co.n2m.platform.meta.resource.metadata.domain;

import org.apache.commons.lang3.builder.ReflectionToStringBuilder;
import org.apache.commons.lang3.builder.ToStringStyle;

import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.media.Schema.AccessMode;
import lombok.Getter;
import lombok.Setter;

/**
 * 메타데이터 셋 연결용 메타데이터 Dto
 * 
 * @author  n2m
 */
@Getter
@Setter
public class MetadataConnectDto {

	@Schema(description="메타데이터 셋 ID", accessMode=AccessMode.WRITE_ONLY)	
	private String medataSetId;
	
	@Schema(description="프라퍼티 ID", accessMode=AccessMode.WRITE_ONLY)	
	private String prptyId;
	
	@Schema(description="값 메타데이터 셋 ID", accessMode=AccessMode.WRITE_ONLY)	
	private String medataVal;
	
	@Override
	public String toString() {
		return ReflectionToStringBuilder.toString(this, ToStringStyle.SHORT_PREFIX_STYLE, true, true);
	}
	
}
