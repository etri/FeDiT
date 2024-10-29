package kr.co.n2m.platform.common.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import lombok.Data;

@Data
@Configuration
@EnableConfigurationProperties
@ConfigurationProperties(prefix = "platform")
public class ApplicationConfig {
	
    @Value("${platform.common.list_max_row_count}")
	private int listMaxRowCount;
}