package kr.co.n2m.platform.meta.resource.metadata.domain;

import org.apache.commons.lang3.builder.ReflectionToStringBuilder;
import org.apache.commons.lang3.builder.ToStringStyle;

import lombok.Getter;
import lombok.Setter;

/**
 * 메타데이터 프라퍼티 조회 정보 Vo
 * 
 * @author  n2m
 */
@Getter
@Setter
public class MetadataPropertyDto extends MetadataVo {
	
	private String medataValNm;	
	private String medataValAmdDt;	
	private String medataValSttusMtcdNm;
	private String medataValModelId; // 실제 모델 ID
	private String dataTypeMtcd;
	
    @Override
    public String toString() {
        return ReflectionToStringBuilder.toString(this, ToStringStyle.SHORT_PREFIX_STYLE, true, true);
    }
    
}
