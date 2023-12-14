package kr.co.e8ight.ndxpro.databroker.config;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.info.Info;
import org.springdoc.core.GroupedOpenApi;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@OpenAPIDefinition(
        info = @Info(title = "NDX PRO Data Broker API 명세서", version = "v1")
)
@Configuration
public class SwaggerConfiguration {
    @Bean
    public GroupedOpenApi openApi(){
        return GroupedOpenApi.builder()
                .group("databroker")
                .pathsToMatch("/**")
                .packagesToScan("kr.co.e8ight.ndxpro.databroker")
                .build();
    }
}
