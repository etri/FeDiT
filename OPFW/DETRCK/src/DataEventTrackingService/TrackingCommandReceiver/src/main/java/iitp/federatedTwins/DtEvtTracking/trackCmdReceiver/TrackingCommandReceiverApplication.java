package iitp.federatedTwins.DtEvtTracking.trackCmdReceiver;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.netflix.eureka.EnableEurekaClient;
import org.springframework.cloud.openfeign.EnableFeignClients;
import org.springframework.context.annotation.ComponentScan;

@SpringBootApplication(scanBasePackages = "iitp.federatedTwins.DtEvtTracking")
@ComponentScan("iitp.federatedTwins.DtEvtTracking")
@MapperScan({ "iitp.federatedTwins.DtEvtTracking.*.mapper" })
@EnableFeignClients
@EnableEurekaClient
public class TrackingCommandReceiverApplication {

	public static void main(String[] args) {
		SpringApplication.run(TrackingCommandReceiverApplication.class, args);
	}

}
