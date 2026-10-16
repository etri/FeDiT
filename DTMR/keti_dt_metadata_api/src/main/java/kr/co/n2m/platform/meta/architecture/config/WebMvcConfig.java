package kr.co.n2m.platform.meta.architecture.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import kr.co.n2m.platform.meta.architecture.interceptor.AuthorizationInterceptor;

/**
 * Web MVC 설정
 * 
 * @author  n2m
 */
@Configuration
public class WebMvcConfig implements WebMvcConfigurer {
	
	@Autowired
	private AuthorizationInterceptor authorizationInterceptor;

	@Override
	public void addInterceptors(InterceptorRegistry registry) {
		registry.addInterceptor(authorizationInterceptor)
			.addPathPatterns("/**")
//			.excludePathPatterns("/")
//			.excludePathPatterns("/error")			
			// Open Api 3.0 (Swagger 3) 관련 제외		
			.excludePathPatterns("/swagger-ui**")
			.excludePathPatterns("/swagger-ui/**")
			.excludePathPatterns("/v3/api-docs/**")
			// 웹소켓 관련 제외
			.excludePathPatterns("/api/v1/portal/stomp**")
			.excludePathPatterns("/api/v1/portal/stomp/**")
			;
		
		WebMvcConfigurer.super.addInterceptors(registry);
	}	
	
	@Override
	public void addCorsMappings(CorsRegistry registry) {
		registry.addMapping("/**")
			.allowedOrigins(new String[] {"*"})
			.allowedHeaders(new String[] {"*"})
			.allowedMethods(new String[] {"*"})
//			.exposedHeaders(new String[] {"*"})
			.maxAge(86400);
	}	

}
