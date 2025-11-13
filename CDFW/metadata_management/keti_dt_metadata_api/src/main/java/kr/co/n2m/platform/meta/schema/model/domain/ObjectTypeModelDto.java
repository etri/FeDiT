package kr.co.n2m.platform.meta.schema.model.domain;

import org.apache.commons.lang3.builder.ReflectionToStringBuilder;
import org.apache.commons.lang3.builder.ToStringStyle;

import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.media.Schema.AccessMode;
import kr.co.n2m.platform.meta.architecture.domain.BaseVo;
import lombok.Getter;
import lombok.Setter;

/**
 * ObjectType 모델 조회 정보 Dto (목록용)
 */
@Schema(description="ObjectType 모델 조회 정보 Dto (목록용)")
@Getter
@Setter
public class ObjectTypeModelDto extends BaseVo {
	@Schema(description="row 번호", accessMode=AccessMode.READ_ONLY)
	private String rownum;
	private String modelId;
	private String modelNm;
	private String modelLogicNm;	
	private String modelDesc;
	
	private String upModelId;
	private String upModelNm;
	private String typeModelId;
	private String typeModelNm;
	
	private String modelDataUri;
	private String modelDataIdPfix;
	private String abstrtModelYn;
	private String structdModelYn;
	private String structdModelSchmaMtcd;
	private String structdModelSchmaMtcdNm;	
	
	private String modelDataSttusMtcd;
	private String modelDataSttusMtcdNm;
	
	private String modelTypeMtcd;
	private String modelAmdDt;	

    @Override
    public String toString() {
        return ReflectionToStringBuilder.toString(this, ToStringStyle.SHORT_PREFIX_STYLE, true, true);
    }
    
}
