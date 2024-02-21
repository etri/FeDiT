package iitp.federatedTwins.msaOrchstr.rsDtTransmitter;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.netflix.eureka.EnableEurekaClient;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.scheduling.annotation.EnableScheduling;

@EnableScheduling // 스케줄링 기능을 enable 함
@SpringBootApplication(scanBasePackages = "iitp.federatedTwins.msaOrchstr")
@ComponentScan("iitp.federatedTwins.msaOrchstr")
@EnableEurekaClient
public class ResultDataTransmitterApplication {
	public static void main(String[] args) {
		SpringApplication.run(ResultDataTransmitterApplication.class, args);
	}
}
