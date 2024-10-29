package kr.co.n2m.platform.meta.schema.property.domain;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.Setter;

/**
 * 메타데이터 프라퍼티 데이터유형 정보 Dto
 * 
 * @author  n2m
 */
@Schema(description="메타데이터 프라퍼티 데이터유형 정보 Dto")
@Getter
@Setter
public class PropertyDataTypeDto {

	private String prptyNm;
	
	private String rangeDataTypeMtcd;	
	private String rangeModelId;	
	private String rangeModelTypeMtcd;
	
}
