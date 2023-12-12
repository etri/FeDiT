package com.stoneitgt.dt.data.platform.admin;

import javax.annotation.PreDestroy;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.boot.builder.SpringApplicationBuilder;
import org.springframework.boot.web.servlet.support.SpringBootServletInitializer;


//import com.ulisesbocchio.jasyptspringboot.annotation.EnableEncryptableProperties;

import lombok.extern.slf4j.Slf4j;

/**
 * Sring-boot 메인 실행 파일.
 *
 * @author yh.kim
 *
 */
@Slf4j
@SpringBootApplication
//@EnableScheduling
public class AdminApplication extends SpringBootServletInitializer {

	@Override
	protected SpringApplicationBuilder configure(SpringApplicationBuilder builder) {
		return builder.sources(AdminApplication.class);
	}

	/**
	 * 메인 함수.
	 *
	 * @param args
	 */
	public static void main(String[] args) {
		SpringApplication.run(AdminApplication.class, args);
	}

	@EventListener(ApplicationReadyEvent.class)
	public void doSomethingAfterStartup() {
		log.warn("DT_DATA_PLATFORM Admin Application started!");
	}

	/**
	 * App이 닫히기 전에 실행되는 함수.
	 */
	@PreDestroy
	public void closeApp() {
		log.warn("DT_DATA_PLATFORM Admin Application closed!");
	}
}
