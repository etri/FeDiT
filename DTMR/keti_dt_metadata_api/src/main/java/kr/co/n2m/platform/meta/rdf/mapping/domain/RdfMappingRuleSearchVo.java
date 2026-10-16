package kr.co.n2m.platform.meta.rdf.mapping.domain;

import java.io.Serializable;
import java.util.List;

import io.swagger.v3.oas.annotations.media.Schema;
import kr.co.n2m.platform.meta.architecture.domain.SearchVo;
import lombok.Getter;
import lombok.Setter;

/**
 * RDF 매핑 규칙 검색 Vo
 * 
 * @author  n2m
 */
@Schema(description="RDF 매핑 규칙 검색 Vo")
@Getter
@Setter
public class RdfMappingRuleSearchVo extends SearchVo implements Serializable {
	
	/** serialVersionUID */
	private static final long serialVersionUID = 2022L;
	
	@Schema(description="RDF 매핑 모델 ID")
	private String rdfMappgModelId;
	
	@Schema(description="메타데이터 셋 ID")
	private String medataSetId;

	@Schema(description="RDF 매핑 규칙 ID")
	private String rdfMappgRuleId;

	@Schema(description="기본 네임스페이스 URI 목록", hidden=true)
	private List<String> defaultNamespaceUriList;
	
}
