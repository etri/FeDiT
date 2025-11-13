package kr.co.n2m.platform.meta.rdf.namespace.domain;

import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.media.Schema.AccessMode;
import kr.co.n2m.platform.meta.architecture.domain.BaseVo;
import lombok.Getter;
import lombok.Setter;
import org.apache.commons.lang3.builder.ReflectionToStringBuilder;
import org.apache.commons.lang3.builder.ToStringStyle;
import org.apache.ibatis.type.Alias;

/**
 * RDF 네임스페이스의 테이블 기본 정보 Vo
 * 
 * @author  n2m
 */
@Schema(description="RDF 네임스페이스의 테이블 기본 정보 Vo")
@Getter
@Setter
@Alias("rdfNamespaceVo")
public class RdfNamespaceVo extends BaseVo {

	@Schema(description="RDF 네임스페이스 ID")
	private String rdfNmspId;
	@Schema(description="RDF 네임스페이스 프리픽스")
	private String rdfNmspPfix;
	@Schema(description="RDF 네임스페이스 프리픽스 - 수정시 사용")
	private String changedRdfNmspPfix;
	@Schema(description="RDF 네임스페이스 URI")
	private String rdfNmspUri;
	@Schema(description="RDF 네임스페이스 적용 메타코드")
	private String rdfNmspAplyMtcd;
	@Schema(description="RDF 네임스페이스 적용 메타코드", hidden = true)
	private String rdfNmspAplyMtcdNm;
	@Schema(description="RDF 네임스페이스 URI - 수정시 사용")
	private String changedRdfNmspUri;
	@Schema(description="RDF 네임스페이스 등록자 ID", accessMode=AccessMode.READ_ONLY)
	private String rdfNmspRegrId;
	@Schema(description="RDF 네임스페이스 등록자명", accessMode=AccessMode.READ_ONLY)
	private String rdfNmspRegrNm;
	@Schema(description="RDF 네임스페이스 등록 일시", accessMode=AccessMode.READ_ONLY)
	private String rdfNmspRegDt;
	@Schema(description="RDF 네임스페이스 수정자 ID", accessMode=AccessMode.READ_ONLY)
	private String rdfNmspAmdrId;
	@Schema(description="RDF 네임스페이스 수정자 명", accessMode=AccessMode.READ_ONLY)
	private String rdfNmspAmdrNm;
	@Schema(description="RDF 네임스페이스 수정 일시", accessMode=AccessMode.READ_ONLY)
	private String rdfNmspAmdDt;
	
	@Override
	public String toString() {
		return ReflectionToStringBuilder.toString(this, ToStringStyle.SHORT_PREFIX_STYLE, true, true);
	}
}
