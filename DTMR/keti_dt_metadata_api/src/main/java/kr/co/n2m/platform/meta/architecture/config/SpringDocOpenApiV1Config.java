package kr.co.n2m.platform.meta.architecture.config;

import org.springdoc.core.GroupedOpenApi;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;

/**
 * <pre>
 * Open Api 3.0 (Swagger 3) 설정      
 * 
 * 1.6.14    /swagger-ui/index.html
 * 
 * https://springdoc.org
 * Spring-boot 2.x (Java 11)
 * </pre>
 * 참고) Spring-boot v3 (Java 17 & Jakarta EE 9) 부터는 https://springdoc.org/v2/
 * 
 * @author  n2m
 */
@Configuration
@Profile(value = "!prod")
public class SpringDocOpenApiV1Config {

    @Bean
    OpenAPI customOpenAPI() {
    	
        // SecuritySecheme명
        String jwtSchemeName = "jwtAuth";
        // API 요청헤더에 인증정보 포함
        SecurityRequirement securityRequirement = new SecurityRequirement().addList(jwtSchemeName);
        // SecuritySchemes 등록
        Components components = new Components()
                .addSecuritySchemes(jwtSchemeName, new SecurityScheme()
                .name(jwtSchemeName)
                .type(SecurityScheme.Type.HTTP) // HTTP 방식
                .scheme("Bearer")
                .bearerFormat("JWT")); // 토큰 형식을 지정하는 임의의 문자(Optional)    	
    	
        return new OpenAPI().info(apiInfo())
        		            .addSecurityItem(securityRequirement)
        		            .components(components);
    }
 
    private Info apiInfo() {
        return new Info()
                .title("디지털트윈 메타데이터 API")
                .description( "디지털트윈 메타데이터 생성 저장 검색 및 제공 프레임워크")
                .version("1.0")
                //.contact(apiContact())
                //.license(apiLicence())
                ;
    }
    
//  private License apiLicence() {
//  return new License()
//          .name("MIT Licence")
//          .url("https://opensource.org/licenses/mit-license.php");
//}
//
//private Contact apiContact() {
//  return new Contact()
//          .name("홍길동")
//          .email("kd.hong@gmail.com")
//          .url("https://github.com/kd.hong");
//} 
    
	
    @Bean
    public GroupedOpenApi externalApi() {
    	return GroupedOpenApi.builder()
    			.group("000.externalApi")			// /meta/v3/api-docs/000.externalApi
    			.displayName("000.외부 API")
    			//2025-07 변경.pathsToMatch("/api/v1/resource/{dataUri}/**", "/api/v1/schema/models/{metaModel}/info", "/api/v1/resource/digitalTwins**", "/api/v1/resource/objects**", "/api/v1/schema/typemodels")
    			.pathsToMatch("/digitalTwins/**")
				.pathsToExclude("/api/v1/resource/categories/**", "/api/v1/resource/metadatasets/**", "/api/v1/resource/metadata/**")
    			//.consumesToMatch(consumesToMatch)
    			//.producesToMatch(producesToMatch)
    			//.headersToMatch(headersToMatch)
    			.build();
    }
    
	@Bean
	public GroupedOpenApi metaApi() {
		return GroupedOpenApi.builder()
				.group("100.metaApi")			// /meta/v3/api-docs/100.metaApi
				.displayName("100.메타데이터")
				.pathsToMatch("/api/v1/resource/**", "/api/v1/collection/**")
				.pathsToExclude("/api/v1/resource/categories/**")
				//.consumesToMatch(consumesToMatch)
				//.producesToMatch(producesToMatch)
				//.headersToMatch(headersToMatch)
				.build();
	}    
	
	@Bean
	public GroupedOpenApi modelApi() {
		return GroupedOpenApi.builder()
				.group("200.modelApi")			// /meta/v3/api-docs/200.modelApi
				.displayName("200.모델(스키마)")
				.pathsToMatch("/api/v1/schema/**")
				//.pathsToExclude(pathsToExclude)
				//.consumesToMatch(consumesToMatch)
				//.producesToMatch(producesToMatch)
				//.headersToMatch(headersToMatch)
				.build();
	}
	
	@Bean
	public GroupedOpenApi admApi() {
		return GroupedOpenApi.builder()
				.group("300.admApi")			// /meta/v3/api-docs/300.admApi
				.displayName("300.관리")
				.pathsToMatch("/api/v1/portal/**", "/api/v1/resource/categories/**")
				//.pathsToExclude(pathsToExclude)
				//.consumesToMatch(consumesToMatch)
				//.producesToMatch(producesToMatch)
				//.headersToMatch(headersToMatch)
				.build();
	}
	
	@Bean
	public GroupedOpenApi rdfApi() {
		return GroupedOpenApi.builder()
				.group("400.rdfApi")			// /meta/v3/api-docs/400.rdfApi
				.displayName("400.RDF")
				.pathsToMatch("/api/v1/rdf/**")
				//.pathsToExclude(pathsToExclude)
				//.consumesToMatch(consumesToMatch)
				//.producesToMatch(producesToMatch)
				//.headersToMatch(headersToMatch)
				.build();
	}	
	
	@Bean
	public GroupedOpenApi allApi() {
		return GroupedOpenApi.builder()
				.group("900.allApi")			// /meta/v3/api-docs/900.allApi
				.displayName("900.전체")
				.pathsToMatch("/**")
				//.pathsToExclude(pathsToExclude)
				//.consumesToMatch(consumesToMatch)
				//.producesToMatch(producesToMatch)
				//.headersToMatch(headersToMatch)
				.build();
	}
	
}
