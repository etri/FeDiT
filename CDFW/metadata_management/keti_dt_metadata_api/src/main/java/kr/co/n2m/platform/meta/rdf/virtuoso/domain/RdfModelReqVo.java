package kr.co.n2m.platform.meta.rdf.virtuoso.domain;

import org.apache.commons.lang3.builder.ReflectionToStringBuilder;
import org.apache.commons.lang3.builder.ToStringStyle;

import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.media.Schema.RequiredMode;
import lombok.Getter;
import lombok.Setter;

/**
 * RDF 문자열 요청 Vo
 * 
 * @author  n2m
 */
@Schema(description="RDF 문자열 요청 Vo")
@Getter
@Setter
public class RdfModelReqVo {
	
	@Schema(description="모델 ID", requiredMode=RequiredMode.REQUIRED)
	private String modelId;
	
	@Schema(description="RDF 형식 코드", requiredMode=RequiredMode.REQUIRED)
	private String rdfFormMtcd;
	
	@Schema(description="RDF 출력 어휘(형식) 코드", requiredMode=RequiredMode.NOT_REQUIRED)
	private String rdfWriteLangMtcd;
	
	@Schema(description="메타데이터 셋 ID", requiredMode=RequiredMode.NOT_REQUIRED)
	private String medataSetId;

	@Schema(description="빈 프라퍼티 보여주기 여부", requiredMode=RequiredMode.NOT_REQUIRED, defaultValue="N")
	private String emptyPrptyShowYn = "N";
	
	@Schema(description="빈 노드에 URI 설정 여부", requiredMode=RequiredMode.NOT_REQUIRED, defaultValue="N")
	private String emptyNodeUriSettingYn = "N";
	
	@Schema(description="RDF 모델 생성 모드 (ALL_SUB_RESOURSE / CURR_RESOURCE)", requiredMode=RequiredMode.NOT_REQUIRED, defaultValue="ALL_SUB_RESOURSE")
	private String rdfModelMakeMode = "ALL_SUB_RESOURSE";
	
	@Override
	public String toString() {
		return ReflectionToStringBuilder.toString(this, ToStringStyle.SHORT_PREFIX_STYLE, true, true);
	}
	
}
