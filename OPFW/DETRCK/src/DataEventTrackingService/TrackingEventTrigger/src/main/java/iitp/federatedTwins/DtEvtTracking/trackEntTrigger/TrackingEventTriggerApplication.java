package iitp.federatedTwins.DtEvtTracking.trackEntTrigger;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.netflix.eureka.EnableEurekaClient;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.scheduling.annotation.EnableScheduling;

@EnableScheduling
@SpringBootApplication(scanBasePackages = "iitp.federatedTwins.DtEvtTracking")
@ComponentScan("iitp.federatedTwins.DtEvtTracking")

@EnableEurekaClient
public class TrackingEventTriggerApplication {

	public static void main(String[] args) {
		SpringApplication.run(TrackingEventTriggerApplication.class, args);
	}

}
