package kr.co.n2m.platform.meta.rdf.property.domain;

import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.media.Schema.AccessMode;
import kr.co.n2m.platform.meta.architecture.domain.BaseVo;
import lombok.Getter;
import lombok.Setter;
import org.apache.ibatis.type.Alias;

import java.time.LocalDateTime;

/**
 * RDF 프라퍼티의 테이블 기본 정보 Vo
 * 
 * @author  n2m
 */
@Schema(description="RDF 프라퍼티의 테이블 기본 정보 Vo")
@Getter
@Setter
@Alias("rdfPropertyVo")
public class RdfPropertyVo extends BaseVo {

	@Schema(description="RDF 프라퍼티 ID")
	private String rdfPrptyId;

	@Schema(description="RDF 프라퍼티", accessMode = AccessMode.READ_ONLY)
	private String rdfPrpty;	// rdfNmspPfix + ':' + rdfPrptyNm(물리명)
	
    @Schema(description = "RDF 프라퍼티 IRI", accessMode = AccessMode.READ_ONLY)
    private String rdfPrptyIri; // rdfNmspUri + rdfPrptyNm

	@Schema(description="RDF 형식 메타코드들")
	private String rdfFormMtcds;

    @Schema(description="RDF 형식 메타코드 명 나열", accessMode = AccessMode.READ_ONLY)
	private String rdfFormMtcdNmStr; 	// 배열 -> 콤마 string_agg

	@Schema(description="RDF 네임스페이스 ID")
	private String rdfNmspId;

	@Schema(description="RDF 프라퍼티명")
	private String rdfPrptyNm;

	@Schema(description="RDF 프라퍼티 설명")
	private String rdfPrptyDesc;

	@Schema(description="RDF 프라퍼티 논리명")
	private String rdfPrptyLogicNm;

	@Schema(description="상위 RDF 프라퍼티 ID")
	private String upRdfPrptyId;

	@Schema(description="RDF 프라퍼티 등록자 ID", accessMode=AccessMode.READ_ONLY)
	private String rdfPrptyRegrId;

	@Schema(description="RDF 프라퍼티 등록자명", accessMode=AccessMode.READ_ONLY)
	private String rdfPrptyRegrNm;

	@Schema(description="RDF 프라퍼티 등록일시", accessMode=AccessMode.READ_ONLY)
	private String rdfPrptyRegDt;

	@Schema(description="RDF 프라퍼티 수정자 ID", accessMode=AccessMode.READ_ONLY)
	private String rdfPrptyAmdrId;

	@Schema(description="RDF 프라퍼티 수정자명", accessMode=AccessMode.READ_ONLY)
	private String rdfPrptyAmdrNm;

	@Schema(description="RDF 프라퍼티 수정일시", accessMode=AccessMode.READ_ONLY)
	private String rdfPrptyAmdDt;
}