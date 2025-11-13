package kr.co.n2m.platform.meta.rdf.mapping.domain;

import java.io.Serializable;

import org.apache.commons.lang3.builder.ReflectionToStringBuilder;
import org.apache.commons.lang3.builder.ToStringStyle;

import io.swagger.v3.oas.annotations.media.Schema;
import kr.co.n2m.platform.meta.architecture.domain.SearchVo;
import lombok.Getter;
import lombok.Setter;

/**
 *  RDF 매핑 검색 parameter Vo
 * 
 * @author  n2m
 */
@Schema(description="RDF 매핑 모델 검색 parameter Vo")
@Getter
@Setter
public class RdfMappingModelSearchVo extends SearchVo implements Serializable {
	
	/** serialVersionUID */
	private static final long serialVersionUID = 2022L;
	
	@Schema(description="매핑 ID")
	private String rdfMappgId;
	
	@Override
	public String toString() {
		return ReflectionToStringBuilder.toString(this, ToStringStyle.SHORT_PREFIX_STYLE, true, true);
	}	
}
