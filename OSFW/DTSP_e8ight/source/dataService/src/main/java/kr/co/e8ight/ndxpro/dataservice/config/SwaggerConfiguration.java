package kr.co.e8ight.ndxpro.dataservice.config;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springdoc.core.GroupedOpenApi;
import org.springdoc.core.customizers.OpenApiCustomiser;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@OpenAPIDefinition(
        info = @Info(title = "NDX PRO Data Service API", version = "v1")
)
@Configuration
public class SwaggerConfiguration {

    @Bean
    public GroupedOpenApi openApi() {
        return GroupedOpenApi.builder()
                .group("1_EAN")
                .displayName("EAN API 목록")
                .pathsToMatch("/ndxpro/v1/**")
                .pathsToExclude("/ndxpro/v1/service/**")
                .packagesToScan("kr.co.e8ight.ndxpro.dataservice")
                .addOpenApiCustomiser(internalApiCustomizer())
                .build();
    }

    @Bean
    public GroupedOpenApi basicApi() {
        return GroupedOpenApi.builder()
                .group("2_NGSI-LD")
                .displayName("NGSI-LD API 목록")
                .pathsToMatch("/ndxpro/v1/service/**")
                .packagesToScan("kr.co.e8ight.ndxpro.dataservice")
                .build();
    }

    @Bean
    public OpenApiCustomiser internalApiCustomizer() {
        return openApi -> openApi
                .addSecurityItem(new SecurityRequirement().addList("Authorization"))
                .getComponents()
                .addSecuritySchemes("Authorization", new SecurityScheme()
                        .in(SecurityScheme.In.HEADER)
                        .type(SecurityScheme.Type.HTTP)
                        .scheme("bearer")
                        .bearerFormat("JWT")
                        .name("bearerAuth")
                        .description("내부 애플리케이션에 API를 제공하는 목적으로 JWT 인증 방식을 사용함"));
    }

}
