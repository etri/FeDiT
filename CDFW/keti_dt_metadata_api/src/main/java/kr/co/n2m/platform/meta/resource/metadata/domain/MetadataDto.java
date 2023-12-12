package kr.co.n2m.platform.meta.resource.metadata.domain;

import org.apache.commons.lang3.builder.ReflectionToStringBuilder;
import org.apache.commons.lang3.builder.ToStringStyle;

import lombok.Getter;
import lombok.Setter;

/**
 * 메타데이터 조회 정보 Vo
 * 
 * @author  n2m
 */
@Getter
@Setter
public class MetadataDto extends MetadataVo {

	private String prptyNm;
	private String prptyLogicNm;
	private String dataArrayYn;
	
	private String modelPrptyMandMtcd;
	private String modelPrptyMandMtcdNm;
	private String modelPrptyValExam;
	
	private String setUsgPrptyYn;
	private String editableYn;
	private String langEnableYn;
	private String dataTypeMtcd;
	private String rangeMtcdGrpId;
	
	private String valModelNm;
	private String valModelLogicNm;
	private String valModelTypeMtcd;
	
	private String medataValNm;
	private String url;	

    @Override
    public String toString() {
        return ReflectionToStringBuilder.toString(this, ToStringStyle.SHORT_PREFIX_STYLE, true, true);
    }
	
}
