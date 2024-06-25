package kr.co.n2m.platform.meta.architecture.property;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import lombok.Data;

@Component
@ConfigurationProperties(prefix = "elastic")
@Data
public class ElasticProperty {
	
	@Value("${elastic.authentication.username}")
	private String username;	

	@Value("${elastic.authentication.password}")
	private String password;	
	
	@Value("${elastic.protocol}")
	private String protocol;
	
	@Value("${elastic.server-ip}")
	private String serverIp;
	
	@Value("${elastic.server-port}")
	private int serverPort;
	
	@Value("${elastic.kibana-port}")
	private int kibanaPort;
	
	@Value("${elastic.fingerprint}")
	private String fingerPrint;
	
	@Value("${elastic.index-name}")
	private String indexName;
	
	@Value("${elastic.kibana-url}")
	private String kibanaUrl;
	
}
