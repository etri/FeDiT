package kr.co.n2m.platform.meta.portal.pat.domain;

import java.io.Serializable;

import org.apache.commons.lang3.builder.ReflectionToStringBuilder;
import org.apache.commons.lang3.builder.ToStringStyle;

import io.swagger.v3.oas.annotations.media.Schema;
import kr.co.n2m.platform.meta.architecture.domain.SearchVo;
import lombok.Getter;
import lombok.Setter;

/**
 * PAT 검색 Vo
 * 
 * @author  n2m
 */
@Schema(description="PAT 검색 Vo")
@Getter
@Setter
public class PatSearchVo extends SearchVo implements Serializable {
	
	/** serialVersionUID */
	private static final long serialVersionUID = 2022L;

	@Schema(description="PAT 등록자 아이디")
	private String patkRegrId;
	
	@Override
	public String toString() {
		return ReflectionToStringBuilder.toString(this, ToStringStyle.SHORT_PREFIX_STYLE, true, true);
	}	

}
