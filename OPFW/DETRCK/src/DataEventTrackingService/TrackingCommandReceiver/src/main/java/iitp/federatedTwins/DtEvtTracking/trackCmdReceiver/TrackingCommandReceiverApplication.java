package iitp.federatedTwins.DtEvtTracking.trackCmdReceiver;

import javax.annotation.PostConstruct;
import javax.annotation.PreDestroy;

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
	
	
	  @PostConstruct 
	  public void init() { 
		  System.out.println("초기화 콜백"); 
		  connect();
	  }
	  
	  @PreDestroy 
	  public void close() { 
		  System.out.println("종료 전 콜백");
		  disconnect(); 
	  }
	  
	  public void connect() { System.out.println("연결 완료 - message : "); }
	  
	  public void disconnect() { System.out.println("연결 종료"); }
	 

}
