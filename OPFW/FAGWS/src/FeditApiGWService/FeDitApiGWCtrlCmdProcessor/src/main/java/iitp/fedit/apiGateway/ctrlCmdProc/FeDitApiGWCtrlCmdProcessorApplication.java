package iitp.fedit.apiGateway.ctrlCmdProc;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.scheduling.annotation.EnableScheduling;

@EnableScheduling
@SpringBootApplication(scanBasePackages = "iitp.fedit.apiGateway")
@ComponentScan("iitp.fedit.apiGateway")

public class FeDitApiGWCtrlCmdProcessorApplication {
	public static void main(String[] args) {
		SpringApplication.run(FeDitApiGWCtrlCmdProcessorApplication.class, args);
	}
}
