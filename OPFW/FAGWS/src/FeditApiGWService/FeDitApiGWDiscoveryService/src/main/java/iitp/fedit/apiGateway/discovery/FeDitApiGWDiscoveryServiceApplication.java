package iitp.fedit.apiGateway.discovery;

import javax.annotation.PostConstruct;
import javax.annotation.PreDestroy;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.netflix.eureka.server.EnableEurekaServer;

@SpringBootApplication
@EnableEurekaServer
public class FeDitApiGWDiscoveryServiceApplication {
	public static void main(String[] args) {
		SpringApplication.run(FeDitApiGWDiscoveryServiceApplication.class, args);
	}

	@PostConstruct
	public void init() {
		connect();
	}

	@PreDestroy
	public void close() {
		disconnect();
	}

	public void connect() {
	}

	public void disconnect() {
	}
}
