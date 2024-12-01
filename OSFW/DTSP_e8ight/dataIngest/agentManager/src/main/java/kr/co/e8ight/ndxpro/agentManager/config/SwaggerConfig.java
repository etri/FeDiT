package kr.co.e8ight.ndxpro.agentManager.config;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.info.Info;
import org.springdoc.core.GroupedOpenApi;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@OpenAPIDefinition(info = @Info(title = "DataIngest API 명세",
        version = "v1"))
@Configuration
public class SwaggerConfig {

    @Bean
    public GroupedOpenApi openApi() {
        return GroupedOpenApi.builder()
                .group("NDXPRO_DATA_INGEST")
                .pathsToMatch("/ndxpro/v1/**")
                .packagesToScan("kr.co.e8ight.ndxpro.agentManager")
                .build();
    }
}