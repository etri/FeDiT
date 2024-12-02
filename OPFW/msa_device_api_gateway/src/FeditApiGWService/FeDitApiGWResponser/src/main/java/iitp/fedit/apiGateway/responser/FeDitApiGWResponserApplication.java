package iitp.fedit.apiGateway.responser;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.ComponentScan;

@SpringBootApplication(scanBasePackages = "iitp.fedit.apiGateway")
@ComponentScan("iitp.fedit.apiGateway")
public class FeDitApiGWResponserApplication {

	public static void main(String[] args) {
		SpringApplication.run(FeDitApiGWResponserApplication.class, args);
	}

}
