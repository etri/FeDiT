package kr.co.n2m.platform.meta.schema.modelproperty.domain;

import org.apache.ibatis.type.Alias;

import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.media.Schema.AccessMode;
import kr.co.n2m.platform.meta.architecture.domain.BaseVo;
import lombok.Getter;
import lombok.Setter;

/**
 * 메타데이터 모델 프라퍼티 Vo
 * 
 * @author  n2m
 */
@Schema(description="메타데이터 모델 프라퍼티 Vo")
@Getter
@Setter
@Alias("modelPropertyVo")
public class ModelPropertyVo extends BaseVo {
	@Schema(description="row 번호", accessMode=AccessMode.READ_ONLY)
	private String rownum;
	
	private String modelPrptyId;
	private String modelId;
	private String modelNm;
	
	private String prptyId;
	private String prptyNm;
	private String prptyLogicNm;
	private String prptyDataSttusMtcd;
	
	private String domnModelId;
	private String domnModelNm;
	
	private String rangeModelId;
	private String rangeModelNm;
	private String rangeModelDataSttusMtcd;
	
	private String modelPrptyMandMtcd;
	private String modelPrptyMandMtcdNm;
	private String modelPrptyValExam;
	private String modelPrptySortOdrg;
	private String tblColnMappgNm;				// TODO : 추후 수정 혹은 삭제 필요
	private String stdModelId;
	private String stdModelNm;
	
	private String modelPrptyDelYn;
	private String modelPrptyDelWhy;
	private String modelPrptyDelDt;
	private String modelPrptyDelrId;
	private String modelPrptyDelrNm;
	
	private String setUsgPrptyYn;
	private String structdModelYn;
	private String rangeDataTypeMtcd;
	private String rangeModelTypeMtcd;
	private String dataArrayYn;
	
	private String cntPrptyYn;
	private String cntModelId;
	
	@Schema(description="모델 프라퍼티 등록자 ID", accessMode=AccessMode.READ_ONLY)
	private String modelPrptyRegrId;
	@Schema(description="모델 프라퍼티 등록자 명", accessMode=AccessMode.READ_ONLY)
	private String modelPrptyRegrNm;
	@Schema(description="모델 프라퍼티 등록 일시", accessMode=AccessMode.READ_ONLY)
	private String modelPrptyRegDt;
	@Schema(description="모델 프라퍼티 수정자 ID", accessMode=AccessMode.READ_ONLY)
	private String modelPrptyAmdrId;
	@Schema(description="모델 프라퍼티 수정자 명", accessMode=AccessMode.READ_ONLY)
	private String modelPrptyAmdrNm;
	@Schema(description="모델 프라퍼티 수정 일시", accessMode=AccessMode.READ_ONLY)
	private String modelPrptyAmdDt;
	
}
