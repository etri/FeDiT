package iitp.federatedTwins.msaOrchstr.common.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

@Configuration
//@ConfigurationProperties(prefix = "")
public class MSAConfigurationProperties {

	
	@Value("${iitp.fedit.orchstr.osfw-server.url:}")
	private String twoThConnBaseUrl = "";
	
	@Value("${iitp.fedit.orchstr.osfw-server.port:0}")
	private int twoThConnBasePort = 0;
	
	@Value("${iitp.fedit.orchstr.cloud-gateway.url:}")
	private String eurekaGatewayConnBaseUrl = "";
	
	@Value("${iitp.fedit.orchstr.cloud-gateway.port:0}")
	private int eurekaGatewayConnBasePort = 0;
	
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

	public String getEurekaGatewayConnBaseUrl() {
		return eurekaGatewayConnBaseUrl;
	}

	public void setEurekaGatewayConnBaseUrl(String eurekaGatewayConnBaseUrl) {
		this.eurekaGatewayConnBaseUrl = eurekaGatewayConnBaseUrl;
	}

	public int getEurekaGatewayConnBasePort() {
		return eurekaGatewayConnBasePort;
	}

	public void setEurekaGatewayConnBasePort(int eurekaGatewayConnBasePort) {
		this.eurekaGatewayConnBasePort = eurekaGatewayConnBasePort;
	}	
}
