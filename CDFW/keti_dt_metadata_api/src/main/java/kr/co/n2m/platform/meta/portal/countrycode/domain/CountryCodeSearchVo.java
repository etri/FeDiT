package kr.co.n2m.platform.meta.portal.countrycode.domain;

import java.io.Serializable;

import org.apache.commons.lang3.builder.ReflectionToStringBuilder;
import org.apache.commons.lang3.builder.ToStringStyle;

import io.swagger.v3.oas.annotations.media.Schema;
import kr.co.n2m.platform.meta.architecture.domain.SearchVo;
import lombok.Getter;
import lombok.Setter;

/**
 * 국가코드 검색 parameter Vo
 * 
 * @author  n2m
 */
@Schema(description="국가코드 검색 parameter Vo")
@Getter
@Setter
public class CountryCodeSearchVo extends SearchVo implements Serializable {

	/** serialVersionUID */
	private static final long serialVersionUID = 2022L;
	
	@Schema(description="국가 코드")
	private String cntryCd;
	@Schema(description="국가명")
	private String cntryNm;
	@Schema(description="국가 데이터 상태 메타코드")
	private String cntryDataSttusMtcd;
	
	@Override
	public String toString() {
		return ReflectionToStringBuilder.toString(this, ToStringStyle.SHORT_PREFIX_STYLE, true, true);
	}
}
