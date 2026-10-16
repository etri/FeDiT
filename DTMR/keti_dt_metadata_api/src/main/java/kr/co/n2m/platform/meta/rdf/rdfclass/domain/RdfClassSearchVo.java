package kr.co.n2m.platform.meta.rdf.rdfclass.domain;

import java.io.Serializable;

import org.apache.ibatis.type.Alias;

import io.swagger.v3.oas.annotations.media.Schema;
import kr.co.n2m.platform.meta.architecture.domain.SearchVo;
import lombok.Getter;
import lombok.Setter;

/**
 * RDF 클래스 parameter Vo
 *
 * @author Ran
 */
@Schema(description = "RDF 클래스 검색 parameter Vo")
@Getter
@Setter
@Alias("rdfClassSearchVo")
public class RdfClassSearchVo extends SearchVo implements Serializable {

	/** serialVersionUID */
	private static final long serialVersionUID = 2022L;

    private String searchClassNm;  // 클래스명 또는 클래스논리명

    private String rdfFormMtcd;

    private String rdfNmspId;

    private String rdfPrptyId;      

    private String rdfClassId;

    private String searchMode;

    private String searchAmdStDt;

    private String searchAmdEdDt;
}