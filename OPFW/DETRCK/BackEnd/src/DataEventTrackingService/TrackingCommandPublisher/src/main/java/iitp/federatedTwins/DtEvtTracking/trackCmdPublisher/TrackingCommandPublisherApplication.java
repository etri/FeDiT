package iitp.federatedTwins.DtEvtTracking.trackCmdPublisher;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.scheduling.annotation.EnableScheduling;

@EnableScheduling
@SpringBootApplication(scanBasePackages = "iitp.federatedTwins.DtEvtTracking")
@ComponentScan("iitp.federatedTwins.DtEvtTracking")

public class TrackingCommandPublisherApplication {

	public static void main(String[] args) {
		SpringApplication.run(TrackingCommandPublisherApplication.class, args);
	}

}
