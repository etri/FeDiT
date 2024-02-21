package iitp.federatedTwins.DtEvtTracking.trackCmdStsChecker;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.netflix.eureka.EnableEurekaClient;
import org.springframework.context.annotation.ComponentScan;

@SpringBootApplication(scanBasePackages = "iitp.federatedTwins.DtEvtTracking")
@ComponentScan("iitp.federatedTwins.DtEvtTracking")

@EnableEurekaClient
public class TrackingCommandStatusCheckerApplication {

	public static void main(String[] args) {
		SpringApplication.run(TrackingCommandStatusCheckerApplication.class, args);
	}

}
