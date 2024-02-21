package iitp.federatedTwins.msaOrchstr.common.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
//@ConfigurationProperties(prefix = "")
public class MSAConfigurationProperties {

	@Value("${TWO_TH_CONN_BASE_URL}")
	private String twoThConnBaseUrl = "";
	
	@Value("${TWO_TH_CONN_BASE_PORT}")
	private int twoThConnBasePort = 0;
	
	@Value("${EUREKA_GATEWAY_CONN_BASE_URL}")
	private String eurekaGatewayConnBaseUrl = "";
	
	@Value("${EUREKA_GATEWAY_CONN_BASE_PORT}")
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
