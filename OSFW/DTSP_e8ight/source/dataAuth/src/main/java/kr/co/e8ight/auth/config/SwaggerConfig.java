package kr.co.e8ight.auth.config;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.info.Info;
import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springdoc.core.GroupedOpenApi;
import org.springdoc.core.customizers.OpenApiCustomiser;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;



// 웹페이지 경로 URL/swagger.ui.html
// swagger custom HealthCheckController 가서 확인하기
@OpenAPIDefinition( info = @Info(title = "NdxPro-Auth-Service API 명세", version = "v1"))
@Configuration
public class SwaggerConfig {
    @Bean
    public GroupedOpenApi openApi(){
        return GroupedOpenApi.builder() // 사용
                .group("NDXPRO-AUTH") // swagger 에 나오는 definition
                .pathsToMatch("/ndxpro/v1/auth/**") // ndxpro로 시작하는 api 사용
                .packagesToScan("kr.co.e8ight.auth")// 패키지 경로
                .addOpenApiCustomiser(publicApiCustomizer())
                .build();
    }

    // swagger 토큰 인증 필요할 시 추가
    @Bean
    public OpenApiCustomiser publicApiCustomizer() {
        return openApi -> openApi.addSecurityItem(new SecurityRequirement().addList("Authorization"))
                .getComponents()
                .addSecuritySchemes("Authorization", new SecurityScheme()
                        .in(SecurityScheme.In.HEADER)
                        .type(SecurityScheme.Type.HTTP)
                        .scheme("bearer")
                        .bearerFormat("JWT"));
    }

    @Bean
    public OpenApiCustomiser internalApiCustomizer() {
        return openApi -> openApi
                .addSecurityItem(new SecurityRequirement().addList("apiKey"))
                .components(new Components()
                        .addSecuritySchemes("apiKey", new SecurityScheme()
                                .type(SecurityScheme.Type.APIKEY)
                                .in(SecurityScheme.In.HEADER)
                                .name("apiKey")));
    }

}
