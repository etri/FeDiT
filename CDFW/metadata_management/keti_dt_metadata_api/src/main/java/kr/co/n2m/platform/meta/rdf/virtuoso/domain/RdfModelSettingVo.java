package kr.co.n2m.platform.meta.rdf.virtuoso.domain;

import io.swagger.v3.oas.annotations.media.Schema;
import kr.co.n2m.platform.meta.rdf.virtuoso.domain.RdfModel.RdfModelMakeMode;
import lombok.Getter;
import lombok.Setter;

/**
 * RDF 모델 설정 Vo
 * 
 * @author  n2m
 */
@Schema(description="RDF 모델 설정 Vo")
@Getter
@Setter
public class RdfModelSettingVo {

	private boolean isShowEmptyPrpty = false;
	private RdfModelMakeMode makeMode;
	private boolean isSettingEmptyNodeUri = true;
	
}
