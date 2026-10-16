package kr.co.n2m.platform.meta.schema.property.domain;

import java.util.List;

import org.apache.ibatis.type.Alias;

import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.media.Schema.AccessMode;
import kr.co.n2m.platform.meta.architecture.domain.BaseVo;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Alias("propertyVo")
public class PropertyVo extends BaseVo {
	@Schema(description="row 번호", accessMode=AccessMode.READ_ONLY)
	private String rownum;
	
	private String prptyId;
	private String upPrptyId;
	@Schema(accessMode=AccessMode.READ_ONLY)
	private String upPrptyNm;	
	private String prptyNm;
	private String prptyLogicNm;
	private String prptyDesc;
	private String prptyDataSttusMtcd;
	@Schema(accessMode=AccessMode.READ_ONLY)
	private String prptyDataSttusMtcdNm;
	private int prptySortOdrg;
	private String cntPrptyYn;
	private String cntModelId;
	private String dataArrayYn;
	private String prptyScrnIndcYn;
	
	@Schema(description="프라퍼티 등록자 ID", accessMode=AccessMode.READ_ONLY)
	private String prptyRegrId;
	@Schema(description="프라퍼티 등록자 명", accessMode=AccessMode.READ_ONLY)
	private String prptyRegrNm;
	@Schema(description="프라퍼티 등록 일시", accessMode=AccessMode.READ_ONLY)
	private String prptyRegDt;
	@Schema(description="프라퍼티 수정자 ID", accessMode=AccessMode.READ_ONLY)
	private String prptyAmdrId;
	@Schema(description="프라퍼티 수정자 명", accessMode=AccessMode.READ_ONLY)
	private String prptyAmdrNm;
	@Schema(description="프라퍼티 수정 일시", accessMode=AccessMode.READ_ONLY)
	private String prptyAmdDt;
	
	private String prptyDefId;
	private String domnModelId;
	@Schema(accessMode=AccessMode.READ_ONLY)
	private String domnModelNm;
	@Schema(accessMode=AccessMode.READ_ONLY)
	private String domnModelLogicNm;
	private String rangeModelId;
	@Schema(accessMode=AccessMode.READ_ONLY)
	private String rangeModelNm;
	@Schema(accessMode=AccessMode.READ_ONLY)
	private String rangeModelLogicNm;
	private String rangeMtcdGrpId;
	private String refPrptyId;	
	private String dataTypeMtcd;
	private String prptyDefChgYn;
	@Schema(description="프라퍼티 정의 변경자 ID", accessMode=AccessMode.READ_ONLY)
	private String prptyDefChgrId;
	@Schema(description="프라퍼티 정의 변경자 명", accessMode=AccessMode.READ_ONLY)
	private String prptyDefChgrNm;
	@Schema(description="프라퍼티 정의 변경 일시", accessMode=AccessMode.READ_ONLY)
	private String prptyDefChgDt;
	private String prptyDefChgWhy;
	
	@Schema(description="프라퍼티 정의 등록자 ID", accessMode=AccessMode.READ_ONLY)
	private String prptyDefRegrId;
	@Schema(description="프라퍼티 정의 등록자 명", accessMode=AccessMode.READ_ONLY)
	private String prptyDefRegrNm;
	@Schema(description="프라퍼티 정의 등록 일시", accessMode=AccessMode.READ_ONLY)
	private String prptyDefRegDt;
	@Schema(description="프라퍼티 정의 수정자 ID", accessMode=AccessMode.READ_ONLY)
	private String prptyDefAmdrId;
	@Schema(description="프라퍼티 정의 수정자 명", accessMode=AccessMode.READ_ONLY)
	private String prptyDefAmdrNm;
	@Schema(description="프라퍼티 정의 수정 일시", accessMode=AccessMode.READ_ONLY)
	private String prptyDefAmdDt;
	
	@Schema(hidden=true, accessMode=AccessMode.READ_ONLY)
	private int checkCnt;
	
	private List<PropertyVo> prptyDefChgList;

}