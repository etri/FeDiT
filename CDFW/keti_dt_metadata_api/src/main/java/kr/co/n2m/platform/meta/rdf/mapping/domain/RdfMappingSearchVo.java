package kr.co.n2m.platform.meta.rdf.mapping.domain;

import java.io.Serializable;

import org.apache.commons.lang3.builder.ReflectionToStringBuilder;
import org.apache.commons.lang3.builder.ToStringStyle;

import io.swagger.v3.oas.annotations.media.Schema;
import kr.co.n2m.platform.meta.architecture.domain.SearchVo;
import lombok.Getter;
import lombok.Setter;

/**
 *  RDF 매핑 검색 parameter Vo
 * 
 * @author  n2m
 */
@Schema(description="RDF 매핑 검색 parameter Vo")
@Getter
@Setter
public class RdfMappingSearchVo extends SearchVo implements Serializable {
	
	/** serialVersionUID */
	private static final long serialVersionUID = 2022L;
	
	@Schema(description="RDF 형식")
	private String rdfFormMtcd;
	@Schema(description="메타데이터 유형 (유형 모델 ID)")
	private String typeModelId;
	@Schema(description="매핑 여부")
	private String rdfMappgYn;
	@Schema(description="RDF 매핑 데이터 상태 코드")
	private String rdfMappgDataSttusMtcd;
	@Schema(description="대표 모델 여부")
	private String rdfRepModelYn;
	
	@Override
	public String toString() {
		return ReflectionToStringBuilder.toString(this, ToStringStyle.SHORT_PREFIX_STYLE, true, true);
	}	
}
