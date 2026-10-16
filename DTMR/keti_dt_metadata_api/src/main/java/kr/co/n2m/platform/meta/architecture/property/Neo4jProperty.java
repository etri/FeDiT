package kr.co.n2m.platform.meta.architecture.property;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import lombok.Data;

@Component
@ConfigurationProperties(prefix = "neo4j")
@Data
public class Neo4jProperty {
	
	@Value("${neo4j.authentication.username}")
	private String username;	

	@Value("${neo4j.authentication.password}")
	private String password;	
	
	@Value("${neo4j.uri}")
	private String uri;
	
	@Value("${neo4j.browser-url}")
	private String browserUrl;
	
}
