package kr.co.e8ight.ndxpro_v1_datamanager;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
//import org.springframework.cloud.netflix.eureka.EnableEurekaClient;
import org.springframework.data.mongodb.config.EnableMongoAuditing;


@EnableMongoAuditing
@SpringBootApplication
//@EnableEurekaClient
public class NdxProV1DataManagerApplication {

    public static void main(String[] args) {
        SpringApplication.run(NdxProV1DataManagerApplication.class, args);
    }


}
