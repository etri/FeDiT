package kr.co.e8ight.ndxpro.fileservice.config;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.info.Info;
import org.springdoc.core.models.GroupedOpenApi;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@OpenAPIDefinition(info = @Info(title = "File Service API 명세", version = "v1.3"))
@Configuration
public class SwaggerConfig {

    @Bean
    public GroupedOpenApi openApi() {
        return GroupedOpenApi.builder()
                .group("NDXPRO_FILE_SERVICE")
                .pathsToMatch("/ndxpro/v1/**")
                .packagesToScan("kr.co.e8ight.ndxpro.fileservice")
                .build();
    }
}