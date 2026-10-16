package kr.co.n2m.platform.meta.resource.metadata.domain;

import org.apache.commons.lang3.builder.ReflectionToStringBuilder;
import org.apache.commons.lang3.builder.ToStringStyle;

import kr.co.n2m.platform.meta.architecture.domain.BaseVo;
import lombok.Getter;
import lombok.Setter;

/**
 * 메타데이터 변경 이력 정보 Vo
 * 
 * @author  n2m
 */
@Getter
@Setter
public class MetadataChgHstVo extends BaseVo {
	
	private String medataChgHstId;
	private String medataSetId;
	private String prptyId;
	private String valModelId;
	private String medataId;
	
	private String chgHstDivMtcd;
	private int    chgAftrRvsn;
	private String chgAftrLangMtcd;	
	private String chgAftrVal;	
	private String chgAftrGeoVal;		
	
	private String chgHstRegrId;
	private String chgHstRegrNm;
	private String chgHstRegDt;
	
    @Override
    public String toString() {
        return ReflectionToStringBuilder.toString(this, ToStringStyle.SHORT_PREFIX_STYLE, true, true);
    }	

}
