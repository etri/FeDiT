package kr.co.jinwoosi.twgateway;

import lombok.AllArgsConstructor;
import org.apache.ibatis.annotations.Mapper;
import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@AllArgsConstructor
@EnableScheduling
@ComponentScan(basePackages = {"net.jw", "kr.co"})
@MapperScan(
        basePackages = {"net.jw.twin.repository"},
        annotationClass = Mapper.class
)
public class TwGatewayApplication {
    public static void main(String[] args) {
        SpringApplication.run(TwGatewayApplication.class, args);
    }
}
