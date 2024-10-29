package kr.co.n2m.platform.meta.rdf.mapping.domain;

import org.apache.commons.lang3.builder.ReflectionToStringBuilder;
import org.apache.commons.lang3.builder.ToStringStyle;
import org.apache.ibatis.type.Alias;

import io.swagger.v3.oas.annotations.media.Schema;
import kr.co.n2m.platform.meta.architecture.domain.BaseVo;
import lombok.Getter;
import lombok.Setter;

/**
 * RDF 매핑 Tree 기본 정보 Vo
 * 
 * @author  n2m
 */
@Schema(description="RDF 매핑 Tree 기본 정보 Vo")
@Getter
@Setter
@Alias("rdfMappingTreeVo")
public class RdfMappingTreeVo extends BaseVo {

	@Schema(description="Tree Node ID")
	private String nodeId;
	@Schema(description="Tree 상위 Node ID")
	private String upNodeId;
	@Schema(description="Tree 상위 Node 구분 ID")
	private String upNodeDivId;
	@Schema(description="순서")
	private String nodeOdrg;
	@Schema(description="Node Object 매핑 여부")
	private String nodeObjtMappgYn;
	@Schema(description="Node Object 클래스 ID")
	private String nodeObjtRdfClassId;
	@Schema(description="Node 구분")
	private String nodeDiv;
	@Schema(description="Node 구분 ID")
	private String nodeDivId;
	@Schema(description="Node 명")
	private String nodeNm;
	@Schema(description="Node 목적어 ID")
	private String nodeObjtId;
	@Schema(description="유형 모델 ID")
	private String typeModelId;
	
	@Override
	public String toString() {
		return ReflectionToStringBuilder.toString(this, ToStringStyle.SHORT_PREFIX_STYLE, true, true);
	}
}
