package kr.co.n2m.platform.common.property;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import lombok.Data;

@Component
@ConfigurationProperties(prefix = "oauth")
@Data
public class OauthProperty {
	
	@Value("${oauth.public-key}")
	private String publicKey;

	@Value("${oauth.access-token}")
	private String accessToken;

}
