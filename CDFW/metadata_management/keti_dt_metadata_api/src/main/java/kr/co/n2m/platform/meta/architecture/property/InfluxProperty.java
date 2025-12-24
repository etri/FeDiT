package kr.co.n2m.platform.meta.architecture.property;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import lombok.Data;

@Component
@ConfigurationProperties(prefix = "influx")
@Data
public class InfluxProperty {
	
	@Value("${influx.authentication.username}")
	private String username;	

	@Value("${influx.authentication.password}")
	private String password;	

    @Value("${influx.url}")
    private String url;
    
    @Value("${influx.browser-url}")
    private String browserUrl;
    
    @Value("${influx.org}")
    private String org;
    
    @Value("${influx.bucket}")
    private String bucket;
    
    @Value("${influx.token}")
    private char[] token;    
    
}
