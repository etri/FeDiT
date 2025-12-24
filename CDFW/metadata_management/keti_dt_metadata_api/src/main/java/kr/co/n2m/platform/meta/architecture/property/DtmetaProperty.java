package kr.co.n2m.platform.meta.architecture.property;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import lombok.Data;

@Component
@ConfigurationProperties(prefix = "dtmeta")
@Data
public class DtmetaProperty {
	
	@Value("${dtmeta.resource.base-url}")
	private String resourceBaseUrl;	

	@Value("${dtmeta.resource.data-url}")
	private String resourceDataUrl;

	@Value("${dtmeta.rdf-schema.base-url}")
	private String rdfSchemaBaseUrl;
	
	@Value("${dtmeta.rdf-schema.skos-url}")
	private String rdfSchemaSkosUrl;
	
	/**
	 * 디지털 트윈 식별체계 적용할 메타데이터 모델 ID. 없으면 적용 안함.
	 * 
	 * TTAK.KO-11.0326-Part3
	 * 디지털 트윈 연합 – 제3부: 디지털 트윈 식별체계
     * Digital Twin Federation – Part 3: Identification Scheme for Digital Twin
	 */
	@Value("${dtmeta.id-scheme.digital-twin}")
	private String idSchmDigitalTwin;
	
	/**
	 * 디지털 트윈 객체 식별체계 적용할 메타데이터 모델 ID. 없으면 적용 안함.
	 * 
	 * TTAK.KO-11.0326-Part5
	 * 디지털 트윈 연합 – 제5부: 디지털 트윈 객체 식별체계
	 * Digital Twin Federation – Part 5: Identification Scheme for Digital Twin Object
	 */
	@Value("${dtmeta.id-scheme.digital-twin-object}")
	private String idSchmDigitalTwinObject;
	
	/**
	 * 디지털 트윈 시각화모델 식별체계 적용할 메타데이터 모델 ID. 없으면 적용 안함.
	 * 기본적으로 디지털 트윈 객체 식별체계를 적용하고 뒤쪽에 3D 모델 분류를 하나 더 붙임.
	 * 
	 * TTAK.KO-11.0326-Part10
	 * 디지털 트윈 연합 – 제10부: 디지털 트윈 3D모델 객체 식별체계
	 * Digital twin federation – Part 10: Identification Scheme for Digital Twin 3D Model object
	 * @since 2025-09-09
	 */
	@Value("${dtmeta.id-scheme.digital-twin-object-vm}")
	private String idSchmDigitalTwinObjectVm;
	
}
