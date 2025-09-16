package kr.co.n2m.platform.meta.schema.idscheme.domain;

import org.apache.commons.lang3.builder.ReflectionToStringBuilder;
import org.apache.commons.lang3.builder.ToStringStyle;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.Setter;

/**
 * 디지털트윈 식별체계 코드 정보 Dto
 * 
 * @author  n2m
 */
@Schema(description="디지털트윈 식별체계 코드 정보 Dto")
@Getter
@Setter
public class IdSchemeCodeDto extends IdSchemeCodeVo {
	
	/**
	 * id_schm_dt/id_schm_object
	 */
	@Schema(description="식별체계 구분")
	private String idSchmDiv;	

	/**
	 * 01/02/1/2
	 */
	@Schema(description="식별체계 분류코드 종류")
	private String idSchmType;
	
	/**
	 * 표준산업분류체계/공공자원분류체계/물품/시설/지형지물
	 */
	@Schema(description="식별체계 분류코드 종류 명")
	private String idSchmTypeNm;
	
	/**
	 * 대/중/소/세/세세
	 */
	@Schema(description="코드 크기 구분 메타코드 명 (대/중/소/세/세세)")
	private String cdSizeDivMtcdNm;
	
    @Override
    public String toString() {
        return ReflectionToStringBuilder.toString(this, ToStringStyle.SHORT_PREFIX_STYLE, true, true);
    }
    
}
