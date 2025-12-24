package kr.co.n2m.platform.meta.rdf.property.domain;

import io.swagger.v3.oas.annotations.media.Schema;
import kr.co.n2m.platform.meta.architecture.domain.SearchVo;
import lombok.*;
import org.apache.ibatis.type.Alias;

import java.io.Serializable;

/**
 *  RDF 프라퍼티  정의 parameter Vo
 * 
 * @author  Ran
 */
@Schema(description="RDF 프라퍼티 정의 검색 parameter Vo")
@Getter
@Setter
@Alias("rdfPropertyDefineSearchVo")
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class RdfPropertyDefineSearchVo extends SearchVo implements Serializable {

	/** serialVersionUID */
	private static final long serialVersionUID = 2022L;

    private String rdfPrptyDefId;

    private String rdfPrptyId;

    private String domnRangeDivMtcd;

    private Integer rdfPrptyDefOdrg;

    private String rdfClassId;
}