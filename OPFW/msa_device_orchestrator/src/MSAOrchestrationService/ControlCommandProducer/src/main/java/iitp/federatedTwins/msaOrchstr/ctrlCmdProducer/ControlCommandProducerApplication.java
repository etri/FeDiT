package iitp.federatedTwins.msaOrchstr.ctrlCmdProducer;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.scheduling.annotation.EnableScheduling;

@EnableScheduling 
@SpringBootApplication(scanBasePackages = "iitp.federatedTwins.msaOrchstr")
@ComponentScan("iitp.federatedTwins.msaOrchstr")

//@EnableEurekaClient
//@EnableDiscoveryClient 
public class ControlCommandProducerApplication 
{
	public static void main( String[] args )
	{
		SpringApplication.run(ControlCommandProducerApplication.class, args);
	}
}
