package net.jw.twin.data_interface.config;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import javax.sql.DataSource;

@Configuration
public class DatabaseConfig {
    @Bean        //application.properties에 설정했던 데이터베이스 관련 정보를 사용하도록 지정합니다.
    @ConfigurationProperties(prefix="spring.datasource")  //prefix를 spring.datasource.hikari로 지정하였기 때문에 spring.datasource.hikari로 시작하는 설정을 이용합니다.
    public HikariConfig hikariConfig() {
        HikariConfig hikariConfig = new HikariConfig();
        hikariConfig.setMaximumPoolSize(15);
        return hikariConfig;
    }

    @Bean
    public DataSource dataSource() {      //hikariConfig를 이용하여 데이터베이스와 연결하는 DataSource를 생성합니다.
        return new HikariDataSource(hikariConfig());
    }
}
