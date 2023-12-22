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
	
}
