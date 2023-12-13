package com.federated.searchRule.restfulApi.config;

import java.util.HashSet;
import java.util.Set;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.transaction.annotation.EnableTransactionManagement;

import springfox.documentation.builders.ApiInfoBuilder;
import springfox.documentation.builders.PathSelectors;
import springfox.documentation.builders.RequestHandlerSelectors;
import springfox.documentation.service.ApiInfo;
import springfox.documentation.spi.DocumentationType;
import springfox.documentation.spring.web.plugins.Docket;
import springfox.documentation.swagger2.annotations.EnableSwagger2;

@MapperScan(value = { "com.federated.searchRule.restfulApi.dao" })
@EnableTransactionManagement
@Configuration
@EnableSwagger2
public class SwaggerConfig {

	private static final String SERVICE_NAME = "FederatedSearchRuleGenerator";
	private static final String API_VERSION = "0.1V";
	private static final String API_DESCRIPTION = "FederatedSearchRuleGenerator API TEST";

	private ApiInfo apiInfo() {
		return new ApiInfoBuilder().title(SERVICE_NAME).version(API_VERSION).description(API_DESCRIPTION).build();

	}

	@Bean
	public Docket api() {
		return new Docket(DocumentationType.SWAGGER_2).apiInfo(apiInfo()).consumes(getConsumeContentTypes())
				.produces(getProduceContentTypes()).select()
				.apis(RequestHandlerSelectors.basePackage("com.federated.searchRule.restfulApi.controller"))
				.paths(PathSelectors.ant("/**")).build();
	}

	private Set<String> getConsumeContentTypes() {
		Set<String> consumes = new HashSet<>();
		consumes.add("application/jsoncharset=UTF-8");
		consumes.add("application/x-www-form-urlencoded");
		consumes.add("application/ld+json");
		return consumes;
	}

	private Set<String> getProduceContentTypes() {
		Set<String> produces = new HashSet<>();
		produces.add("application/ld+json");
		return produces;
	}

}
