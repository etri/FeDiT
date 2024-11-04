package iitp.federatedTwins.msaOrchstr.rsDtTransmitter;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
//import org.springframework.cloud.netflix.eureka.EnableEurekaClient;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.scheduling.annotation.EnableScheduling;

@EnableScheduling
@SpringBootApplication(scanBasePackages = "iitp.federatedTwins.msaOrchstr")
@ComponentScan("iitp.federatedTwins.msaOrchstr")
public class ResultDataTransmitterApplication {
	public static void main(String[] args) {
		SpringApplication.run(ResultDataTransmitterApplication.class, args);
	}
}
