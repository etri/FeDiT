package kr.co.n2m.platform.meta;

import java.util.TimeZone;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;

/**
 * 디지털 트윈 메타데이터 시스템 Application
 * 
 * @author  n2m
 */
@SpringBootApplication
@EnableCaching
public class MetaApplication {

	public static void main(String[] args) {
		TimeZone.setDefault(TimeZone.getTimeZone("Asia/Seoul"));
		SpringApplication.run(MetaApplication.class, args);
	}

}
