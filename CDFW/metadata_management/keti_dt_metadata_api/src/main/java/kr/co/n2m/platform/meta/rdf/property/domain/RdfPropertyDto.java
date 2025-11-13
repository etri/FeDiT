package kr.co.n2m.platform.meta.rdf.property.domain;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.Setter;
import org.apache.ibatis.type.Alias;

/**
 * RDF 프라퍼티 목록을 조회하기 위한 DTO
 *
 *	rdfClassId 일치 & domn_range_div_mtcd ='domain'
 *
 * @author n2m
 */
@Schema(description = "RDF 프라퍼티 목록을 조회하기 위한 DTO")
@Getter
@Setter
@Alias("rdfPropertyDto")
public class RdfPropertyDto extends RdfPropertyVo {

    private String rdfClassStr;     // 범위 rdf 클래스

    private String rdfPrptyDefId;   // RDF 클래스 상세 조회 시, RDF 프라퍼티 목록 조회 시 함께 출력하는 "domain" 정의 ID
    
    private String rownum;

    private String upRdfPrpty;  // 상위 rdfProperty의 rdfProperty = rdfNmspPfix + ':' + rdfPrptyNm(물리명)

}