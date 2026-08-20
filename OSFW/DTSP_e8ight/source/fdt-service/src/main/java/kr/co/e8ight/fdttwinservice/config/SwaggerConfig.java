package kr.co.e8ight.fdttwinservice.config;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.info.Info;
import org.springdoc.core.models.GroupedOpenApi;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

// 웹페이지 경로 URL/swagger-ui.html
@OpenAPIDefinition(info = @Info(title = "연합트윈 서비스 API 명세",
        version = "v1"))
@Configuration
public class SwaggerConfig {

    @Bean
    public GroupedOpenApi openApi() {
        return GroupedOpenApi.builder() // 사용
                .group("FDT_SERVICE") // swagger definition
                .pathsToMatch("/api/fdt/**") // api로 시작하는 api 사용
                .packagesToScan("kr.co.e8ight.fdttwinservice")// 패키지 경로
                .build();
    }

}
