package kr.co.n2m.platform.meta.portal.commondata.domain;

import java.io.Serializable;
import java.util.List;

import org.apache.commons.lang3.builder.ReflectionToStringBuilder;
import org.apache.commons.lang3.builder.ToStringStyle;

import io.swagger.v3.oas.annotations.media.Schema;
import kr.co.n2m.platform.meta.architecture.domain.SearchVo;
import lombok.Getter;
import lombok.Setter;

/**
 * 공통 데이터 검색 Vo 
 * 
 * @author  n2m
 */
@Schema(description="공통 데이터 검색 Vo")
@Getter
@Setter
public class CommonSearchVo extends SearchVo implements Serializable {

	/** serialVersionUID */
	private static final long serialVersionUID = 2022L;
	
	private final String pltfrmId = "meta"; // meta
	
	private String userId;
	
	private List<String> autOidList;
	
	@Override
	public String toString() {
		return ReflectionToStringBuilder.toString(this, ToStringStyle.SHORT_PREFIX_STYLE, true, true);
	}

}
