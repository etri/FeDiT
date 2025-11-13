package kr.co.n2m.platform.meta.rdf.property.domain;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.Setter;
import org.apache.ibatis.type.Alias;

/**
 * RDF 프라퍼티 정의 목록을 조회하기 위한 DTO
 *
 *
 *
 * @author n2m
 */
@Schema(description = "RDF 프라퍼티 목록을 조회하기 위한 DTO")
@Getter
@Setter
@Alias("rdfPropertyDefineDto")
public class RdfPropertyDefineDto extends RdfPropertyDefineVo {
	
    private String rdfClass;

    private String rdfPrpty;
	
	@Schema(description="RDF 프라퍼티명")
	private String rdfPrptyNm;

	@Schema(description="RDF 프라퍼티 논리명")
	private String rdfPrptyLogicNm;
    
    private String rdfClassStr;     // 범위 rdf 클래스
    
    private String rownum;

}