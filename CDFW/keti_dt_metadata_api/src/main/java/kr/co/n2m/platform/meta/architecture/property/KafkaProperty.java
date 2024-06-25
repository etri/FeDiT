package kr.co.n2m.platform.meta.architecture.property;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import lombok.Data;

@Component
@ConfigurationProperties(prefix = "spring.kafka")
@Data
public class KafkaProperty {
	
	@Value("${spring.profiles.active}")
	private String activeProfile;
	
	@Value("${spring.kafka.bootstrap-servers}")
	private String kafkaServers;
	
	@Value("${spring.kafka.client-id}")
	private String kafkaClientId;	
	
	@Value("${spring.kafka.auth.user-id}")
	private String kafkaUserId;
	
	@Value("${spring.kafka.auth.user-pw}")
	private String kafkaUserPw;
		
}
