package iitp.fedit.apiGateway.cloud;

import javax.annotation.PostConstruct;
import javax.annotation.PreDestroy;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.netflix.eureka.EnableEurekaClient;

@SpringBootApplication
@EnableEurekaClient
public class FeDitApiGWCloudGatewayApplication {
	public static void main(String[] args) {
		SpringApplication.run(FeDitApiGWCloudGatewayApplication.class, args);
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
