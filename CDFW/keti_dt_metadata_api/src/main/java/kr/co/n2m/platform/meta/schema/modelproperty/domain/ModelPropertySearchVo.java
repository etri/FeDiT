package kr.co.n2m.platform.meta.schema.modelproperty.domain;

import java.io.Serializable;

import org.apache.ibatis.type.Alias;

import io.swagger.v3.oas.annotations.media.Schema;
import kr.co.n2m.platform.meta.architecture.domain.SearchVo;
import lombok.Getter;
import lombok.Setter;

/**
 * 메타데이터 모델 프라퍼티 검색 Vo
 * 
 * @author  n2m
 */
@Schema(description="메타데이터 모델 프라퍼티 검색 Vo")
@Getter
@Setter
@Alias("modelPropertySearchVo")
public class ModelPropertySearchVo extends SearchVo implements Serializable {
	
	/** serialVersionUID */
	private static final long serialVersionUID = 2022L;
	
	private String searchName;
	private String modelId;
	private String modelPrptyId;
	private String prptyId;
	
	@Schema(description="모델 프라퍼티 삭제 여부")	
	private String modelPrptyDelYn = "N"; // 기본값 : N
	
	private String domnModelId;
	
	private String prptyDataSttusMtcd;
	
	private String typeModelId;
	
}
