package kr.co.n2m.platform.meta.schema.modelproperty.domain;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.Setter;

/**
 * 메타데이터 모델 프라퍼티 상세 정보 Dto
 * 
 * @author  n2m
 */
@Schema(description="메타데이터 모델 프라퍼티 상세 정보 Dto")
@Getter
@Setter
public class ModelPropertyInfoDto {
	
	private String modelPrptyId;
	private String modelId;
	private String prptyId;
	private String modelPrptyMandMtcd;
	private String modelPrptyMandMtcdNm;
	private String modelPrptySortOdrg;
	private String modelPrptyValExam;
	private String tblColnMappgNm;		// TODO : 추후 수정 혹은 삭제 필요
	private String stdModelId;
	private String modelPrptyDelYn;
	
	private String prptyNm;
	private String prptyLogicNm;
	private String dataArrayYn;
	private String prptyScrnIndcYn;
	
	private String cntPrptyYn;
	private String cntModelId;
	private String cntModelNm;
	
	private String domnModelId;
	private String rangeModelId;
	private String rangeMtcdGrpId;
	private String prptyDefChgYn;
	
	private String domnModelNm;
	private String domnModelLogicNm;
	
	private String rangeModelNm;
	private String rangeModelLogicNm;
	private String rangeModelTypeMtcd;
	private String rangeTypeModelId;
	private String rangeTypeModelNm;
	private String rangeDataTypeMtcd;
	private String rangeUseLangMtcd;
	private String rangeRefPrptyNm;
	
	private String setUsgPrptyYn;
	
	private String stdModelNm;
}
