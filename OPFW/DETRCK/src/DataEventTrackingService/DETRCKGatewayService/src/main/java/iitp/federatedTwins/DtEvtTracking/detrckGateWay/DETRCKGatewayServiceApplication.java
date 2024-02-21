package iitp.federatedTwins.DtEvtTracking.detrckGateWay;

import javax.annotation.PostConstruct;
import javax.annotation.PreDestroy;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.netflix.eureka.EnableEurekaClient;

@SpringBootApplication
@EnableEurekaClient
public class DETRCKGatewayServiceApplication {
	public static void main(String[] args) {
		SpringApplication.run(DETRCKGatewayServiceApplication.class, args);
	}

	private final Logger logger = LoggerFactory.getLogger(DETRCKGatewayServiceApplication.class);

		
	//	@PostConstruct, @PreDestroy 

	@PostConstruct	
	public void init() {
		logger.info("@EnableEurekaServer");
		connect();
	}

	@PreDestroy
	public void close() {
		logger.info("종료 전 콜백");
		disconnect();
	}

	public void connect() {
		logger.info("연결 완료 - message : ");
	}

	public void disconnect() {
		logger.info("연결 종료");
	}
}
