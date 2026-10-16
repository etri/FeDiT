package kr.co.n2m.platform.meta.rdf.mapping.domain;

import org.apache.commons.lang3.builder.ReflectionToStringBuilder;
import org.apache.commons.lang3.builder.ToStringStyle;
import org.apache.ibatis.type.Alias;

import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.media.Schema.AccessMode;
import kr.co.n2m.platform.meta.architecture.domain.BaseVo;
import lombok.Getter;
import lombok.Setter;

/**
 * RDF 매핑 테이블 기본 정보 Vo
 * 
 * @author  n2m
 */
@Schema(description="RDF 매핑 테이블 기본 정보 Vo")
@Getter
@Setter
@Alias("rdfMappingVo")
public class RdfMappingVo extends BaseVo {

	@Schema(description="RDF 매핑 ID")
	private String rdfMappgId;
	@Schema(description="RDF 형식 메타코드")
	private String rdfFormMtcd;
	@Schema(description="RDF 형식 메타코드 명")
	private String rdfFormMtcdNm;
	@Schema(description="유형 모델 ID")
	private String typeModelId;
	@Schema(description="유형 모델 명")
	private String typeModelNm;
	@Schema(description="유형 모델 논리 명")
	private String modelLogicNm;
	@Schema(description="RDF 매핑 명")
	private String rdfMappgNm;
	@Schema(description="RDF 매핑 데이터 상태 메타코드")
	private String rdfMappgDataSttusMtcd;
	@Schema(description="RDF 매핑 데이터 상태 메타코드 명")
	private String rdfMappgDataSttusMtcdNm;
	@Schema(description="RDF 매핑 등록자 ID", accessMode=AccessMode.READ_ONLY)
	private String rdfMappgRegrId;
	@Schema(description="RDF 매핑 등록자 명", accessMode=AccessMode.READ_ONLY)
	private String rdfMappgRegrNm;
	@Schema(description="RDF 매핑 등록 일시", accessMode=AccessMode.READ_ONLY)
	private String rdfMappgRegDt;
	@Schema(description="RDF 매핑 수정자 ID", accessMode=AccessMode.READ_ONLY)
	private String rdfMappgAmdrId;
	@Schema(description="RDF 매핑 수정자 명", accessMode=AccessMode.READ_ONLY)
	private String rdfMappgAmdrNm;
	@Schema(description="RDF 매핑 수정 일시", accessMode=AccessMode.READ_ONLY)
	private String rdfMappgAmdDt;
	
	@Override
	public String toString() {
		return ReflectionToStringBuilder.toString(this, ToStringStyle.SHORT_PREFIX_STYLE, true, true);
	}
}
