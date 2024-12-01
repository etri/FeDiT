package iitp.federatedTwins.msaOrchstr.ctrlCmdReceiver;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
//import org.springframework.cloud.client.discovery.EnableDiscoveryClient;
import org.springframework.cloud.netflix.eureka.EnableEurekaClient;
import org.springframework.cloud.openfeign.EnableFeignClients;
import org.springframework.context.annotation.ComponentScan;

@SpringBootApplication(scanBasePackages = "iitp.federatedTwins.msaOrchstr")
@ComponentScan("iitp.federatedTwins.msaOrchstr")
@MapperScan({ "iitp.federatedTwins.msaOrchstr.*.mapper" })
@EnableFeignClients
@EnableEurekaClient
//@EnableDiscoveryClient 
public class ControlCommandReceiverApplication {
	public static void main(String[] args) {
		SpringApplication.run(ControlCommandReceiverApplication.class, args);
	}

}
