package iitp.fedit.apiGateway.receiver;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;
//import org.springframework.cloud.client.discovery.EnableDiscoveryClient;
import org.springframework.cloud.netflix.eureka.EnableEurekaClient;
import org.springframework.cloud.openfeign.EnableFeignClients;
import org.springframework.context.annotation.ComponentScan;

@SpringBootApplication(scanBasePackages = "iitp.fedit.apiGateway")
@ComponentScan("iitp.fedit.apiGateway")
@MapperScan({ "iitp.fedit.apiGateway.*.mapper" })
@EnableFeignClients
@EnableEurekaClient
@EnableDiscoveryClient
public class FeDitApiGWReceiverApplication {
	public static void main(String[] args) {
		SpringApplication.run(FeDitApiGWReceiverApplication.class, args);
	}
}
