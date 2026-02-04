package iitp.fedit.apiGateway.receiver.config;

import org.springdoc.core.GroupedOpenApi;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;

@Configuration
public class OpenApiConfig {

	@Bean
	public OpenAPI openAPI(@Value("${springdoc.version}") String springdocVersion) {
		Info info = new Info().title("CtrlApiGateway-User-Interface").version(springdocVersion)
				.description("apiGateway 사용자 인터페이스");

		return new OpenAPI().components(new Components()).info(info);
	}

	@Bean
	public GroupedOpenApi getRoutingServiceApi() {

		return GroupedOpenApi.builder().group("Routing Service").pathsToMatch("/fedit/gateway/**").build();

	}

}