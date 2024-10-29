package kr.co.n2m.platform.meta.schema.model.domain;

import java.io.Serializable;

import org.apache.ibatis.type.Alias;

import io.swagger.v3.oas.annotations.media.Schema;
import kr.co.n2m.platform.meta.architecture.domain.SearchVo;
import lombok.Getter;
import lombok.Setter;

/**
 * 메타데이터 모델 검색 Vo
 * 
 * @author  n2m
 */
@Schema(description="메타데이터 모델 검색 Vo")
@Getter
@Setter
@Alias("modelSearchVo")
public class ModelSearchVo extends SearchVo implements Serializable {
	
	/** serialVersionUID */
	private static final long serialVersionUID = 2022L;
	
	private String searchMode;
	private String searchName;
	private String searchAmdStDt;
	private String searchAmdEdDt;

	private String modelId;
	private String upModelId;
	private String typeModelId;
	private String modelNm;
	private String modelLogicNm;
	private String modelDesc;
	private String modelDataSttusMtcd;
	private String modelTypeMtcd;
	private String abstrtModelYn;
	private String structdModelYn;
	private String modelDataUri;
	
	private String typeModelYn;
	private String stdModelYn;
	private String dataTypeModelYn;
	
	private String dataArrayYn;
	
}
