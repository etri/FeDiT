package kr.co.n2m.platform.meta.rdf.namespace.domain;

import java.io.Serializable;

import org.apache.commons.lang3.builder.ReflectionToStringBuilder;
import org.apache.commons.lang3.builder.ToStringStyle;

import io.swagger.v3.oas.annotations.media.Schema;
import kr.co.n2m.platform.meta.architecture.domain.SearchVo;
import lombok.Getter;
import lombok.Setter;

/**
 *  RDF 네임스페이스 parameter Vo
 * 
 * @author  n2m
 */
@Schema(description="RDF 네임스페이스 검색 parameter Vo")
@Getter
@Setter
public class RdfNamespaceSearchVo extends SearchVo implements Serializable {
	
	/** serialVersionUID */
	private static final long serialVersionUID = 2022L;
	
	@Schema(description="RDF 네임스페이스 URI")
	private String rdfNmspUri;
	@Schema(description="RDF 네임스페이스 프리픽스")
	private String rdfNmspPfix;
	@Schema(description="RDF 네임스페이스 적용 메타코드")
	private String rdfNmspAplyMtcd;
	@Override
	public String toString() {
		return ReflectionToStringBuilder.toString(this, ToStringStyle.SHORT_PREFIX_STYLE, true, true);
	}	
}
