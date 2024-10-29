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
@Schema(description="RDF 매핑 모델 테이블 기본 정보 Vo")
@Getter
@Setter
@Alias("rdfMappingModelVo")
public class RdfMappingModelVo extends BaseVo {

	@Schema(description="RDF 매핑 모델 ID")
	private String rdfMappgModelId;
	@Schema(description="RDF 매핑 ID")
	private String rdfMappgId;
	@Schema(description="RDF 클래스 ID")
	private String rdfClassId;
	@Schema(description="RDF 클래스 명")
	private String rdfClassNm;
	@Schema(description="RDF 클래스 논리 명")
	private String rdfClassLogicNm;
	@Schema(description="RDF 클래스", accessMode=AccessMode.READ_ONLY)
	private String rdfClass;
	@Schema(description="RDF 클래스 IRI", accessMode=AccessMode.READ_ONLY)
	private String rdfClassIri;	
	@Schema(description="RDF 대표 모델 여부")
	private String rdfRepModelYn;
	@Schema(description="RDF 조건 순서")
	private Integer rdfCondOdrg;
	@Schema(description="조건 모델 ID")
	private String condModelId;
	@Schema(description="조건 모델 명")
	private String condModelNm;
	@Schema(description="RDF 매핑 모델 등록자 ID", accessMode=AccessMode.READ_ONLY)
	private String rdfMappgModelRegrId;
	@Schema(description="RDF 매핑 모델 등록자 명", accessMode=AccessMode.READ_ONLY)
	private String rdfMappgModelRegrNm;
	@Schema(description="RDF 매핑 모델 등록 일시", accessMode=AccessMode.READ_ONLY)
	private String rdfMappgModelRegDt;
	@Schema(description="RDF 매핑 모델 수정자 ID", accessMode=AccessMode.READ_ONLY)
	private String rdfMappgModelAmdrId;
	@Schema(description="RDF 매핑 모델 수정자 명", accessMode=AccessMode.READ_ONLY)
	private String rdfMappgModelAmdrNm;
	@Schema(description="RDF 매핑 모델 수정 일시", accessMode=AccessMode.READ_ONLY)
	private String rdfMappgModelAmdDt;
	
	@Override
	public String toString() {
		return ReflectionToStringBuilder.toString(this, ToStringStyle.SHORT_PREFIX_STYLE, true, true);
	}
}
