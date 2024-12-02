package iitp.federatedTwins.msaOrchstr.rsDtConsumer;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.netflix.eureka.EnableEurekaClient;
import org.springframework.context.annotation.ComponentScan;

@SpringBootApplication(scanBasePackages = "iitp.federatedTwins.msaOrchstr")
@ComponentScan("iitp.federatedTwins.msaOrchstr")
@EnableEurekaClient
public class ResultDataConsumerApplication {

	public static void main(String[] args) {
		SpringApplication.run(ResultDataConsumerApplication.class, args);
	}

}
