package net.jw.twin.tw_service_manager;

import org.apache.ibatis.annotations.Mapper;
import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.core.env.Environment;

@ComponentScan(basePackages = {"net.jw"})
@SpringBootApplication
@MapperScan(
        basePackages = {"net.jw.twin.repository"},
        annotationClass = Mapper.class
)
public class Applications {
    public static void main(String[] args) {

//        System.out.println("server.port : " + System.getProperty("server.port"));
//        System.out.println("spring.datasource.jdbc-url : " + System.getProperty("spring.datasource.jdbc-url"));

        ConfigurableApplicationContext context = SpringApplication.run(Applications.class, args);

        Environment env = context.getEnvironment();
        String propertyValue = env.getProperty("spring.datasource.jdbc-url");

        System.out.println("spring.datasource.jdbc-url: " + propertyValue);
    }

}
