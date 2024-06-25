package kr.co.n2m.platform.meta.resource.metadata.domain;

import org.apache.commons.lang3.builder.ReflectionToStringBuilder;
import org.apache.commons.lang3.builder.ToStringStyle;

import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.media.Schema.AccessMode;
import kr.co.n2m.platform.meta.architecture.domain.BaseVo;
import lombok.Getter;
import lombok.Setter;

/**
 * 메타데이터 셋 정보 Vo
 * 
 * @author  n2m
 */
@Getter
@Setter
public class MetadataSetVo extends BaseVo {

	@Schema(description="메타데이터 셋 ID", accessMode=AccessMode.READ_ONLY)
	private String medataSetId;
	@Schema(description="메타데이터 모델 ID")
	private String modelId;
	@Schema(description="메타데이터 셋 명")
	private String medataSetNm;
	@Schema(description="메타데이터 셋 논리명(한글)")
	private String medataSetLogicNm;
	@Schema(description="메타데이터 셋 설명")
	private String medataSetDesc;
	@Schema(description="메타데이터 셋 상태 코드")
	private String medataSetSttusMtcd;
	@Schema(description="메타데이터 셋 상태 사유")
	private String medataSetSttusWhy;
	@Schema(description="최신 리비전", accessMode=AccessMode.READ_ONLY)
	private int medataSetNwstRvsn;
	
	@Schema(description="등록자 ID", accessMode=AccessMode.READ_ONLY)
	private String medataSetRegrId;
	@Schema(description="등록자 명", accessMode=AccessMode.READ_ONLY)
	private String medataSetRegrNm;
	@Schema(description="등록일시", accessMode=AccessMode.READ_ONLY)
	private String medataSetRegDt;
	@Schema(description="수정자 ID", accessMode=AccessMode.READ_ONLY)
	private String medataSetAmdrId;
	@Schema(description="수정자 명", accessMode=AccessMode.READ_ONLY)
	private String medataSetAmdrNm;
	@Schema(description="수정일시", accessMode=AccessMode.READ_ONLY)
	private String medataSetAmdDt;
		
	// 디지털트윈 연합 식별체계 용
	@Schema(description="식별체계 국가코드")
	private String idSchmCntryCd;
		
	/**
	 * <pre>
	 * id_schm_dt 디지털트윈 식별체계 분류코드 종류 (2자리)
	 * 01: 표준산업분류체계 - 산업자원에 대한 디지털 트윈 분류체계
	 * 02: 공공자원분류체계 - 공공자원에 대한 디지털 트윈 분류체계
	 * 
	 * id_schm_object 디지털트윈 객체 식별체계 분류코드 종류 (1자리)
	 * 1: 물품 - 디지털 트윈에 구현된 물품에 대한 분류
	 * 2: 시설 - 디지털 트윈에 구현된 시설에 대한 분류
	 * </pre>
	 */
	@Schema(description="식별체계 분류코드 종류")
	private String idSchmType;
	
	/**
	 * <pre>
	 * id_schm_dt 디지털트윈 식별체계 코드 (6자리)
	 * 표준산업분류체계/공공자원분류체계 의 대분류(1자리) + 하위 분류코드(5자리) 결합 6자리  
	 * ex) C24112
	 * 
	 * id_schm_object 디지털트윈 객체 식별체계 코드 (5자리)
	 * 물품/시설의 중분류코드 5자리
	 * ex) 04617
	 * </pre>
	 */
	@Schema(description="식별체계 코드")
	private String idSchmCd;
	
	@Schema(description="식별체계 PREFIX", hidden=true)
	private String idSchmPrefix;
	@Schema(description="식별체계 년도 사용 여부 (식별체계 PREFIX 값이 있는 경우만)", hidden=true)
	private String idSchmYearUseYn;	

    @Override
    public String toString() {
        return ReflectionToStringBuilder.toString(this, ToStringStyle.SHORT_PREFIX_STYLE, true, true);
    }	
    
}
