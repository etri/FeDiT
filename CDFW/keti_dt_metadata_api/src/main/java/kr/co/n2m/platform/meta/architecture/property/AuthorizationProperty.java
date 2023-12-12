package kr.co.n2m.platform.meta.architecture.property;

import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import lombok.Data;

@Component
@ConfigurationProperties(prefix = "authorization")
@Data
public class AuthorizationProperty {
	
	@Value("${authorization.data}")
	private String authorization;
	
	@Value("${authorization.default-auth.use-flag}")
	private String defaultAuthUseFlag;
	
	@Value("${authorization.default-auth.list}")
	private List<String> defaultAuthList;
	
}