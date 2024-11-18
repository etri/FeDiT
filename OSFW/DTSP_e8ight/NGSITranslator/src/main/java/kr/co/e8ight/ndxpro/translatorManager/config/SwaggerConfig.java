package kr.co.e8ight.ndxpro.translatorManager.config;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.info.Info;
import org.springdoc.core.GroupedOpenApi;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@OpenAPIDefinition(info = @Info(title = "세종 5-1 NDXPRO NGSI-LD ngsiTranslator명세서", version = "v1.1"))
@Configuration
public class SwaggerConfig {

    @Bean
    public GroupedOpenApi openApi() {
        return GroupedOpenApi.builder()
                .group("NDXPRO_NGSI_Translator")
                .pathsToMatch("/ndxpro/v1/translator/**")
                .packagesToScan("kr.co.e8ight.ndxpro.translatorManager")
                .build();
    }
}
