package iitp.federatedTwins.msaOrchstr.msaGateWay;

import javax.annotation.PostConstruct;
import javax.annotation.PreDestroy;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.netflix.eureka.EnableEurekaClient;

@SpringBootApplication
@EnableEurekaClient
public class MSAGatewayServiceApplication {
	public static void main(String[] args) {
		SpringApplication.run(MSAGatewayServiceApplication.class, args);
	}

	@PostConstruct
	public void init() {
		System.out.println("@EnableEurekaServer");
		connect();
	}

	@PreDestroy
	public void close() {
		System.out.println("종료 전 콜백");
		disconnect();
	}

	public void connect() {
		System.out.println("연결 완료 - message : ");
	}

	public void disconnect() {
		System.out.println("연결 종료");
	}
}
