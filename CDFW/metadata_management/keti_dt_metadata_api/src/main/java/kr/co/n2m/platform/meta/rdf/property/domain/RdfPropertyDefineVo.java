package kr.co.n2m.platform.meta.rdf.property.domain;

import io.swagger.v3.oas.annotations.media.Schema;
import kr.co.n2m.platform.meta.architecture.domain.BaseVo;
import lombok.Getter;
import lombok.Setter;
import org.apache.ibatis.type.Alias;

/**
 * RDF 프라퍼티정의의 테이블 기본 정보 Vo
 * 
 * @author  n2m
 */
@Schema(description="RDF 프라퍼티정의의 테이블 기본 정보 Vo")
@Getter
@Setter
@Alias("rdfPropertyDefineVo")
public class RdfPropertyDefineVo extends BaseVo {

	@Schema(description="RDF 프라퍼티 정의 ID")
	private String rdfPrptyDefId;

	@Schema(description="RDF 프라퍼티 ID")
	private String rdfPrptyId;

	@Schema(description="도메인 범위 구분 메타코드")
	private String domnRangeDivMtcd;

	@Schema(description="RDF 프라퍼티 정의 순서")
	private Integer rdfPrptyDefOdrg;

	@Schema(description="RDF 클래스 ID")
	private String rdfClassId;
}