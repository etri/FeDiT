package kr.co.n2m.platform.common.property;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import lombok.Data;

@Component
@ConfigurationProperties(prefix = "platform")
@Data
public class FileProperty {

	@Value("${platform.common.file.upload-dir}")
	private String uploadDir;
	
	@Value("${platform.common.file.upload-url}")
	private String uploadUrl;

}
