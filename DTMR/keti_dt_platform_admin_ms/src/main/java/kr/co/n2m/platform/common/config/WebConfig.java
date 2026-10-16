package kr.co.n2m.platform.common.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import kr.co.n2m.platform.common.interceptor.CommonHandlerInterceptor;

@Configuration
public class WebConfig implements WebMvcConfigurer {

	@Autowired
	private CommonHandlerInterceptor commonHandlerInterceptor;

	@Override
	public void addInterceptors(InterceptorRegistry registry) {
		registry.addInterceptor(commonHandlerInterceptor).addPathPatterns("/**");

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
