package kr.co.n2m.platform.meta.rdf.mapping.domain;

import lombok.Getter;
import lombok.Setter;
import org.apache.commons.lang3.builder.ReflectionToStringBuilder;
import org.apache.commons.lang3.builder.ToStringStyle;

/**
 * RDF 매핑 규칙 정보 Dto
 * 
 * @author  n2m
 */
@Getter
@Setter
public class RdfMappingRuleDto extends RdfMappingRuleVo {

	private String predctRdfPropertyNm;
	private String predctRdfProperty;
	private String predctRdfPropertyIri;
	private String objtRdfClassNm;
	private String objtRdfClass;
	private String objtRdfClassIri;
	private String rdfFormMtcd;
	
	private int    emptyNodeOrdg;
	private String rdfMappgModelId;
    @Override
    public String toString() {
        return ReflectionToStringBuilder.toString(this, ToStringStyle.SHORT_PREFIX_STYLE, true, true);
    }
    
}
