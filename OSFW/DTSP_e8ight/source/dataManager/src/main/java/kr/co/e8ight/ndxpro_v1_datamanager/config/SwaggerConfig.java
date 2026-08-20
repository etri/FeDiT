package kr.co.e8ight.ndxpro_v1_datamanager.config;


import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.info.Info;
import org.springdoc.core.GroupedOpenApi;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;


// 웹페이지 경로 URL/swagger-ui.html
@OpenAPIDefinition(info = @Info(title = "DataManager API 명세",
        version = "v1"))
@Configuration
public class SwaggerConfig {

    @Bean
    public GroupedOpenApi openApi() {
        return GroupedOpenApi.builder() // 사용
                .group("NDXPRO_DATAMANAGER") // swagger 에나오는 definition
                .pathsToMatch("/ndxpro/v1/manager/**") // api로 시작하는 api 사용
                .packagesToScan("kr.co.e8ight.ndxpro_v1_datamanager")// 패키지 경로
                .build();
    }

}
