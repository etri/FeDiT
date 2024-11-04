package kr.co.e8ight.ndxpro_gateway.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.reactive.CorsConfigurationSource;
import org.springframework.web.cors.reactive.CorsWebFilter;
import org.springframework.web.cors.reactive.UrlBasedCorsConfigurationSource;

@Configuration
public class CorsConfigurations extends CorsConfiguration {

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        CorsConfiguration corsConfiguration = new CorsConfiguration();
//        corsConfiguration.addAllowedHeader("*");
        corsConfiguration.addAllowedHeader("x-requested-with");
        corsConfiguration.addAllowedHeader("authorization");
        corsConfiguration.addAllowedHeader("content-type");
        corsConfiguration.addAllowedHeader("credential");
        corsConfiguration.addAllowedHeader("X-AUTH-TOKEN");
        corsConfiguration.addAllowedHeader("X-CSRF-TOKEN");
        corsConfiguration.addAllowedHeader("Link");
        corsConfiguration.addAllowedHeader("access-control-allow-origin");

        corsConfiguration.addAllowedOriginPattern("*");
        corsConfiguration.addAllowedMethod("*");

        corsConfiguration.setAllowCredentials(true);
        source.registerCorsConfiguration("/**", corsConfiguration);
        return source;
    }

    @Bean
    public CorsWebFilter corsWebFilter() {
        return new CorsWebFilter(corsConfigurationSource());
    }
}