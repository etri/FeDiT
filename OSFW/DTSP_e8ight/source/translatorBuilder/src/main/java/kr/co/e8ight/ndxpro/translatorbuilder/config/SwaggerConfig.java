package kr.co.e8ight.ndxpro.translatorbuilder.config;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.info.Info;
import org.springdoc.core.models.GroupedOpenApi;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@OpenAPIDefinition(info = @Info(title = "TranslatorBuilder API 명세",
        version = "v1.2"))
@Configuration
public class SwaggerConfig {

    @Bean
    public GroupedOpenApi openApi() {
        return GroupedOpenApi.builder()
                .group("NDXPRO_Translator_Builder")
                .pathsToMatch("/ndxpro/v1/translator-builder/**")
                .packagesToScan("kr.co.e8ight.ndxpro.translatorbuilder")
                .build();
    }
}
