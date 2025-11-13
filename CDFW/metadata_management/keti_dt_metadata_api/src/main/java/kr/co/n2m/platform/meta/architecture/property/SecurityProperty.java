package kr.co.n2m.platform.meta.architecture.property;


import javax.crypto.SecretKey;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import io.jsonwebtoken.security.Keys;
import lombok.Data;

@Component
@ConfigurationProperties(prefix = "security")
@Data
public class SecurityProperty {
	
    @Value("${security.secret-key}")
    private String secretKey;
    
    public SecretKey getSecretKey() {
        SecretKey cvtSecretKey = Keys.hmacShaKeyFor(secretKey.getBytes());
        return cvtSecretKey;
    }

}
