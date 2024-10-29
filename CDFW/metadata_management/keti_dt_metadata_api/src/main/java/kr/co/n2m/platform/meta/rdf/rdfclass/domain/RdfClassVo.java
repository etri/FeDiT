package kr.co.n2m.platform.meta.rdf.rdfclass.domain;

import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.media.Schema.AccessMode;
import kr.co.n2m.platform.meta.architecture.domain.BaseVo;
import lombok.Getter;
import lombok.Setter;
import org.apache.ibatis.type.Alias;

/**
 * RDF 클래스의 테이블 기본 정보 Vo
 *
 * @author n2m
 */
@Schema(description = "RDF 클래스의 테이블 기본 정보 Vo")
@Getter
@Setter
@Alias("rdfClassVo")
public class RdfClassVo extends BaseVo {

    @Schema(description = "RDF 클래스 ID")
    private String rdfClassId;

    @Schema(description="RDF 형식 메타코드들")
    private String rdfFormMtcds;

    @Schema(description="RDF 형식 메타코드 명 나열", accessMode = AccessMode.READ_ONLY)
	private String rdfFormMtcdNmStr; 	// 배열 -> 콤마 string_agg
    
    @Schema(description = "RDF 클래스 IRI", accessMode = AccessMode.READ_ONLY)
    private String rdfClassIri;        // rdfNmspUri + rdfClassNm

    @Schema(description = "RDF 클래스", accessMode = AccessMode.READ_ONLY)
    private String rdfClass;        //  rdfNmspPfix + ':' + 물리명

    @Schema(description = "RDF 네임스페이스 ID")
    private String rdfNmspId;

    @Schema(description = "RDF 클래스명")
    private String rdfClassNm;

    @Schema(description = "RDF 클래스 설명")
    private String rdfClassDesc;

    @Schema(description = "RDF 클래스 논리명")
    private String rdfClassLogicNm;

    @Schema(description = "상위 RDF 클래스 ID")
    private String upRdfClassId;

    @Schema(description = "RDF 클래스 등록자 ID", accessMode = AccessMode.READ_ONLY)
    private String rdfClassRegrId;

    @Schema(description = "RDF 클래스 등록자명", accessMode = AccessMode.READ_ONLY)
    private String rdfClassRegrNm;

    @Schema(description = "RDF 클래스 등록일시", accessMode = AccessMode.READ_ONLY)
    private String rdfClassRegDt;

    @Schema(description = "RDF 클래스 수정자 ID", accessMode = AccessMode.READ_ONLY)
    private String rdfClassAmdrId;

    @Schema(description = "RDF 클래스 수정자명", accessMode = AccessMode.READ_ONLY)
    private String rdfClassAmdrNm;

    @Schema(description = "RDF 클래스 수정일시", accessMode = AccessMode.READ_ONLY)
    private String rdfClassAmdDt;

}