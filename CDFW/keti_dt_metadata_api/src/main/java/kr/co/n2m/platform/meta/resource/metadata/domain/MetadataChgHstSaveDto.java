package kr.co.n2m.platform.meta.resource.metadata.domain;

import java.util.List;
import java.util.Map;

import org.apache.commons.lang3.builder.ReflectionToStringBuilder;
import org.apache.commons.lang3.builder.ToStringStyle;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.Setter;

/**
 * 메타데이터 변경 이력 저장용 Dto
 * 
 * @author  n2m
 */
@Getter
@Setter
public class MetadataChgHstSaveDto extends MetadataChgHstVo {
	
	@Schema(description="메타데이터 값 List", hidden=true)
	private List<String> includedMetadataValList;
	
	@Schema(description="메타데이터 Map List", hidden=true)
	private List<Map<String, String>> includedMetadataMapList;
	
	@Schema(description="메타데이터 셋 내용과 같은 특수 프라퍼티 제외 여부")
	private String exceptForMetadataSetYn;
	
    @Override
    public String toString() {
        return ReflectionToStringBuilder.toString(this, ToStringStyle.SHORT_PREFIX_STYLE, true, true);
    }	

}
