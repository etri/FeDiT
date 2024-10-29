package kr.co.n2m.platform.meta.resource.metadata.domain;

import org.apache.commons.lang3.builder.ReflectionToStringBuilder;
import org.apache.commons.lang3.builder.ToStringStyle;

import kr.co.n2m.platform.meta.architecture.domain.BaseVo;
import lombok.Getter;
import lombok.Setter;

/**
 * 메타데이터 정보 Vo
 * 
 * @author  n2m
 */
@Getter
@Setter
public class MetadataVo extends BaseVo {

	private String medataId;	
	private String medataSetId;
	private String prptyId;
	private String valModelId;	
	private String modelPrptyId;	
	private String langMtcd;	
	private String medataVal;	
	private String geodataVal;	
	
    @Override
    public String toString() {
        return ReflectionToStringBuilder.toString(this, ToStringStyle.SHORT_PREFIX_STYLE, true, true);
    }
    
}
