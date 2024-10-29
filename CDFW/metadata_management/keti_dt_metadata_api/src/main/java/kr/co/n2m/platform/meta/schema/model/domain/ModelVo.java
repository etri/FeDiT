package kr.co.n2m.platform.meta.schema.model.domain;

import org.apache.commons.lang3.StringUtils;
import org.apache.commons.lang3.builder.ReflectionToStringBuilder;
import org.apache.commons.lang3.builder.ToStringStyle;
import org.apache.ibatis.type.Alias;

import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.media.Schema.AccessMode;
import kr.co.n2m.platform.meta.architecture.domain.BaseVo;
import lombok.Getter;
import lombok.Setter;

/**
 * 메타데이터 모델 Vo
 * 
 * @author  n2m
 */
@Schema(description="메타데이터 모델 Vo")
@Getter
@Setter
@Alias("modelVo")
public class ModelVo extends BaseVo {
	
	private String modelId;
	private String upModelId;
	@Schema(accessMode=AccessMode.READ_ONLY)	
	private String upModelNm;
	@Schema(accessMode=AccessMode.READ_ONLY)	
	private String upModelLogicNm;
	private String typeModelId;
	@Schema(accessMode=AccessMode.READ_ONLY)	
	private String typeModelNm;	
	@Schema(accessMode=AccessMode.READ_ONLY)	
	private String typeModelLogicNm;
	private String modelNm;
	private String modelLogicNm;
	private String modelDesc;
	private String modelDataSttusMtcd;
	@Schema(accessMode=AccessMode.READ_ONLY)
	private String modelDataSttusMtcdNm;
	private int modelSortOdrg;
	private String modelTypeMtcd;
	private String abstrtModelYn;
	private String structdModelYn;
	private String structdModelSchmaMtcd;
	@Schema(accessMode=AccessMode.READ_ONLY)
	private String structdModelSchmaMtcdNm;
	private String modelDataUri;
	private String modelDataIdPfix;
	private String dataTypeMtcd;
	private String dataTypeValExam;
	private String mtcdGrpId;
	@Schema(accessMode=AccessMode.READ_ONLY)
	private String mtcdGrpIdNm;
	private String useLangMtcd;
	@Schema(accessMode=AccessMode.READ_ONLY)
	private String useLangMtcdNm;
	
	@Schema(description="모델 등록자 ID", accessMode=AccessMode.READ_ONLY)
	private String modelRegrId;
	@Schema(description="모델 등록자 명", accessMode=AccessMode.READ_ONLY)
	private String modelRegrNm;
	@Schema(description="모델 등록 일시", accessMode=AccessMode.READ_ONLY)
	private String modelRegDt;
	@Schema(description="모델 수정자 ID", accessMode=AccessMode.READ_ONLY)
	private String modelAmdrId;
	@Schema(description="모델 수정자 명", accessMode=AccessMode.READ_ONLY)
	private String modelAmdrNm;
	@Schema(description="모델 수정 일시", accessMode=AccessMode.READ_ONLY)
	private String modelAmdDt;
	
	/**
	 * 유형 모델 여부 (object_type 이고 1레벨 모델)
	 */
	@Schema(description="유형 모델 여부 (object_type 이고 1레벨 모델)", accessMode=AccessMode.READ_ONLY)
	public String getTypeModelYn() {
		return StringUtils.equals(upModelId, "Class") && StringUtils.equals(modelTypeMtcd, "object_type") ? "Y" : "N";
	}

	/**
	 * 표준 모델 여부 (object_type 이고 2레벨 이상 모델)
	 */
	@Schema(description="표준 모델 여부 (object_type 이고 2레벨 이상 모델)", accessMode=AccessMode.READ_ONLY)
	public String getStdModelYn() {
		return !StringUtils.equals(upModelId, "Class") && StringUtils.equals(modelTypeMtcd, "object_type") ? "Y" : "N";
	}
	
	/**
	 * 데이터 유형 모델 여부 (data_type 이고 2레벨 이상 모델)
	 */
	@Schema(description="데이터 유형 모델 여부 (data_type 이고 2레벨 이상 모델)", accessMode=AccessMode.READ_ONLY)
	public String getDataTypeModelYn() {
		return !StringUtils.equals(modelId, "DataType") && StringUtils.equals(modelTypeMtcd, "data_type") ? "Y" : "N";
	}	
	
    @Override
    public String toString() {
        return ReflectionToStringBuilder.toString(this, ToStringStyle.SHORT_PREFIX_STYLE, true, true);
    }
    
}
