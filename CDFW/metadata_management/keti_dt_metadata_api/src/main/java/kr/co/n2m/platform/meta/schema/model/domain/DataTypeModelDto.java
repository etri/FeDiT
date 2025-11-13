package kr.co.n2m.platform.meta.schema.model.domain;

import org.apache.commons.lang3.builder.ReflectionToStringBuilder;
import org.apache.commons.lang3.builder.ToStringStyle;

import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.media.Schema.AccessMode;
import kr.co.n2m.platform.meta.architecture.domain.BaseVo;
import lombok.Getter;
import lombok.Setter;

/**
 * DataType 모델 조회 정보 Dto (목록용)
 */
@Schema(description="DataType 모델 조회 정보 Dto (목록용)")
@Getter
@Setter
public class DataTypeModelDto extends BaseVo {
	@Schema(description="row 번호", accessMode=AccessMode.READ_ONLY)
	private String rownum;
	private String modelId;
	private String modelNm;
	private String modelLogicNm;	
	private String modelDesc;
	
	private String dataTypeMtcd;
	private String dataTypeValExam;
	private String mtcdGrpId;
	private String mtcdGrpIdNm;
	private String useLangMtcd;
	private String useLangMtcdNm;
	
	private String modelDataSttusMtcd;
	private String modelDataSttusMtcdNm;
	
	private String modelTypeMtcd;
	private String modelAmdDt;	

    @Override
    public String toString() {
        return ReflectionToStringBuilder.toString(this, ToStringStyle.SHORT_PREFIX_STYLE, true, true);
    }
    
}
