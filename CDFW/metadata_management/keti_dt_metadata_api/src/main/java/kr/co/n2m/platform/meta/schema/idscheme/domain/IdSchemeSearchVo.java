package kr.co.n2m.platform.meta.schema.idscheme.domain;

import java.io.Serializable;

import org.apache.commons.lang3.builder.ReflectionToStringBuilder;
import org.apache.commons.lang3.builder.ToStringStyle;

import io.swagger.v3.oas.annotations.media.Schema;
import kr.co.n2m.platform.meta.architecture.domain.SearchVo;
import lombok.Getter;
import lombok.Setter;

/**
 * 디지털트윈 식별체계 코드 검색 Vo
 * 
 * @author  n2m
 */
@Schema(description="디지털트윈 식별체계 코드 검색 Vo")
@Getter
@Setter
public class IdSchemeSearchVo extends SearchVo implements Serializable {
		
	/** serialVersionUID */
	private static final long serialVersionUID = 2022L;
	
	/**
	 * <pre>
	 * [MCG00028] 식별체계 구분
	 * - id_schm_dt     : 디지털트윈 식별체계
	 * - id_schm_object : 디지털트윈 객체 식별체계
	 * </pre>
	 */
	@Schema(description="식별체계 구분")
	private String idSchmDiv;
	
	/**
	 * <pre>
	 * [MCG00029] 식별체계 분류코드 종류
	 * id_schm_dt 디지털트윈 식별체계 분류코드 종류 (2자리)
	 * - 01: 표준산업분류체계 - 산업자원에 대한 디지털 트윈 분류체계
	 * - 02: 공공자원분류체계 - 공공자원에 대한 디지털 트윈 분류체계
	 * 
	 * id_schm_object 디지털트윈 객체 식별체계 분류코드 종류 (1자리)
	 * - 1: 물품 - 디지털 트윈에 구현된 물품에 대한 분류
	 * - 2: 시설 - 디지털 트윈에 구현된 시설에 대한 분류
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
	
	@Schema(description="식별체계 코드 명")
	private String idSchmCdNm;	
	
	/**
	 * <pre>
	 * - A/B/C~U: 표준산업분류체계 대분류 코드
	 * - A/B/C~P: 공공자원분류체계 대분류 코드
	 * - 1: 물품
	 * - 2: 시설
	 * </pre>
	 */	
	@Schema(description="대분류 외부 코드")
	private String lctgExtrCd;
	
	@Schema(description="식별 사용 여부")	
	private String idfyUseYn;
	
	@Schema(description="사용 여부")
	private String useYn;	
	
	@Override
	public String toString() {
		return ReflectionToStringBuilder.toString(this, ToStringStyle.SHORT_PREFIX_STYLE, true, true);
	}
	
}
