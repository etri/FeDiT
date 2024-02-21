package iitp.federatedTwins.msaOrchstr.ctrlCmdStsChekcer;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.scheduling.annotation.EnableScheduling;

@EnableScheduling // 스케줄링 기능을 enable 함
@SpringBootApplication(scanBasePackages = "iitp.federatedTwins.msaOrchstr")
@ComponentScan("iitp.federatedTwins.msaOrchstr")

public class ControlCommandStatusCheckerApplication {
	public static void main(String[] args) {
		SpringApplication.run(ControlCommandStatusCheckerApplication.class, args);
	}
}
