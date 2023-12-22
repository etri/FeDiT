package kr.co.n2m.platform.meta.portal.commondata.domain;

import org.apache.commons.lang3.builder.ReflectionToStringBuilder;
import org.apache.commons.lang3.builder.ToStringStyle;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.Setter;

/**
 * 공통 API 권한 정보 Dto 
 * 
 * @author  n2m
 */
@Schema(description="공통 API 권한 정보 Dto")
@Getter
@Setter
public class CommonAuthApiUrlDto {
	
	private String autOid;
	
	private String apiUrl;

	private String mthdCd;
	
	@Override
	public String toString() {
		return ReflectionToStringBuilder.toString(this, ToStringStyle.SHORT_PREFIX_STYLE, true, true);
	}
}
