package kr.co.n2m.platform.meta.rdf.rdfclass.domain;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.Setter;
import org.apache.ibatis.type.Alias;

/**
 * RDF 클래스 목록을 조회하기 위한 DTO
 *
 * @author n2m
 */
@Schema(description = "RDF 클래스 목록을 조회하기 위한 DTO")
@Getter
@Setter
@Alias("rdfClassDto")
public class RdfClassDto extends RdfClassVo {
    
    private String rownum;

    private String upRdfClass;  //  상위 rdfClass의 rdfClass = rdfNmspPfix + ':' + rdfPrptyNm(물리명)
    
    private String upRdfClassNm;

}