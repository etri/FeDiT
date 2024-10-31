package com.federated.searchRule.restfulApi;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@EnableScheduling
@SpringBootApplication
public class FederatedSearchRuleGeneratorApplication {

	public static void main(String[] args) {
		SpringApplication.run(FederatedSearchRuleGeneratorApplication.class, args);
	}

}
