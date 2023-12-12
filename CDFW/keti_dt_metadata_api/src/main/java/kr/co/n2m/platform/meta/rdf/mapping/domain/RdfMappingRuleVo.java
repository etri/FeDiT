package kr.co.n2m.platform.meta.rdf.mapping.domain;

import org.apache.commons.lang3.builder.ReflectionToStringBuilder;
import org.apache.commons.lang3.builder.ToStringStyle;

import kr.co.n2m.platform.meta.architecture.domain.BaseVo;
import lombok.Getter;
import lombok.Setter;

/**
 * RDF 매핑 규칙 Vo
 * 
 * @author  n2m
 */
@Getter
@Setter
public class RdfMappingRuleVo extends BaseVo {

	private String rdfMappgRuleId;
	private String rdfMappgModelId;
	private Integer rdfMappgRuleOdrg;
	private String upRdfMappgRuleId;
	private String rdfPrptyId;
	private String objtDataMappgYn;
	private String nodeObjtRdfClassId;
	private String objtRdfClassId;
	private String objtLiteralYn;
	private String objtPrptyId;
	private String objtPrptyDeleteYn;
	private String objtRdfMappgId;
	private String rdfMappgRuleRegDt;
	private String rdfMappgRuleAmdDt;
	
    @Override
    public String toString() {
        return ReflectionToStringBuilder.toString(this, ToStringStyle.SHORT_PREFIX_STYLE, true, true);
    }
	
}
