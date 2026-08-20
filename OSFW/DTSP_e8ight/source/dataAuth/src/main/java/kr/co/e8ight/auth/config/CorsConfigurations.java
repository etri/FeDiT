package kr.co.e8ight.auth.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;


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
      corsConfiguration.addAllowedHeader("access-control-allow-origin");

      corsConfiguration.addAllowedOriginPattern("*");
      corsConfiguration.addAllowedMethod("*");

      corsConfiguration.setAllowCredentials(true);
      source.registerCorsConfiguration("/ndxpro/v1/auth/**", corsConfiguration);
      return source;
   }

   @Bean
   public CorsFilter corsWebFilter() {
      return new CorsFilter( corsConfigurationSource());
   }
}
