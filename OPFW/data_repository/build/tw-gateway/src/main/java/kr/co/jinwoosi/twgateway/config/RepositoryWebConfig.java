package kr.co.jinwoosi.twgateway.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.reactive.CorsWebFilter;
import org.springframework.web.cors.reactive.UrlBasedCorsConfigurationSource;

@Configuration
public class RepositoryWebConfig {
    @Value("${jcms.repository.repository-url}")
    private String url;

    @Bean
    public CorsWebFilter corsWebFilter() {
        org.springframework.web.cors.CorsConfiguration corsConfig = new org.springframework.web.cors.CorsConfiguration();

        corsConfig.addAllowedOrigin("*");
        corsConfig.addAllowedMethod("*");
        corsConfig.addAllowedHeader("*");
//        corsConfig.setAllowCredentials(true);
        corsConfig.setMaxAge(3600L);

        // reactive 스택용 UrlBasedCorsConfigurationSource 사용
        org.springframework.web.cors.reactive.UrlBasedCorsConfigurationSource source =
                new org.springframework.web.cors.reactive.UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", corsConfig);

        return new org.springframework.web.cors.reactive.CorsWebFilter(source);
    }

    @Bean
    public WebClient repositoryWeb(WebClient.Builder builder) {
        return builder
                .baseUrl(url)
                .defaultHeaders(headers -> {
                    headers.add(HttpHeaders.ACCEPT, MediaType.APPLICATION_JSON_VALUE);
                    headers.add(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE);
                })
                .build();
    }

}
