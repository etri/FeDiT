package iitp.fedit.apiGateway.common.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

@Configuration
public class MSAConfigurationProperties {

	@Value("${iitp.fedit.orchstr.osfw-server.url:}")
	private String twoThConnBaseUrl = "";

	@Value("${iitp.fedit.orchstr.osfw-server.port:0}")
	private int twoThConnBasePort = 0;

	public String getTwoThConnBaseUrl() {
		return twoThConnBaseUrl;
	}

	public void setTwoThConnBaseUrl(String twoThConnBaseUrl) {
		this.twoThConnBaseUrl = twoThConnBaseUrl;
	}

	public int getTwoThConnBasePort() {
		return twoThConnBasePort;
	}

	public void setTwoThConnBasePort(int twoThConnBasePort) {
		this.twoThConnBasePort = twoThConnBasePort;
	}
}
