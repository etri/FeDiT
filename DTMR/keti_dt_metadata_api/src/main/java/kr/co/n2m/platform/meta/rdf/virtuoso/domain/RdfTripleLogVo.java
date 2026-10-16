package kr.co.n2m.platform.meta.rdf.virtuoso.domain;

import org.apache.commons.lang3.builder.ReflectionToStringBuilder;
import org.apache.commons.lang3.builder.ToStringStyle;

import io.swagger.v3.oas.annotations.media.Schema;
import kr.co.n2m.platform.meta.architecture.domain.BaseVo;
import lombok.Getter;
import lombok.Setter;

/**
 * RDF 트리플 로그 Vo
 * 
 * @author  n2m
 */
@Schema(description="RDF 트리플 로그 Vo")
@Getter
@Setter
public class RdfTripleLogVo extends BaseVo {

	private String rdfTripleLogId;
	private String logDt;
	private String sbjtRi;
	private String predctRi;
	private String objtRi;
	private String logDivMtcd;
	private String logStoreLoNm;
	private String logRegrId;
	
	@Override
	public String toString() {
		return ReflectionToStringBuilder.toString(this, ToStringStyle.SHORT_PREFIX_STYLE, true, true);
	}
	
}
