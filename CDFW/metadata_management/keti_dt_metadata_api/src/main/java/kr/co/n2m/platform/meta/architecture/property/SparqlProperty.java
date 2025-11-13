package kr.co.n2m.platform.meta.architecture.property;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import lombok.Data;

@Component
@ConfigurationProperties(prefix = "virtuoso")
@Data
public class SparqlProperty {
	@Value("${virtuoso.datasource.url}")
	private String url;	

	@Value("${virtuoso.datasource.username}")
	private String username;

	@Value("${virtuoso.datasource.password}")
	private String password;	
	
	@Value("${virtuoso.graph.dev}")
	private String devGraphName;
	
	@Value("${virtuoso.graph.use}")
	private String useGraphName;
	
	@Value("${virtuoso.conductor-url}")
	private String conductorUrl;
	
	@Value("${virtuoso.query-endpoint}")
	private String queryEndpoint;
	
	@Value("${virtuoso.update-endpoint}")
	private String updateEndpoint;
	
	@Value("${virtuoso.gsp-endpoint}")
	private String gspEndpoint;
}
