package kr.co.n2m.platform.meta.rdf.property.domain;

import java.io.Serializable;

import lombok.*;
import org.apache.ibatis.type.Alias;

import io.swagger.v3.oas.annotations.media.Schema;
import kr.co.n2m.platform.meta.architecture.domain.SearchVo;

/**
 *  RDF 프라퍼티 parameter Vo
 * 
 * @author  Ran
 */
@Schema(description="RDF 프라퍼티 검색 parameter Vo")
@Getter
@Setter
@Alias("rdfPropertySearchVo")
public class RdfPropertySearchVo extends SearchVo implements Serializable {

	/** serialVersionUID */
	private static final long serialVersionUID = 2022L;

    private String searchAmdStDt;

    private String searchAmdEdDt;

    private String rdfFormMtcd;

    private String rdfNmspId;

    private String searchPrptyNm;   // 논리명 또는 물리명

    private String rdfPrptyDesc;

    private String rdfPrptyId;      // 쿼리에 넣는 용도
    
    private String rdfClassId;		// domain 모드에서 사용

    private String rangeRdfClassId;

    private String domnRangeDivMtcd;

    private String searchMode;      // Ex) RDF 클래스 상세 조회 시, 'domain'에 해당하는 프라퍼티 목록 조회
}