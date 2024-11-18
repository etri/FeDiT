package kr.co.e8ight.auth.config;

import kr.co.e8ight.auth.jwt.JwtAccessDeniedHandler;
import kr.co.e8ight.auth.jwt.JwtAuthenticationEntryPoint;
import kr.co.e8ight.auth.jwt.JwtSecurityConfig;
import kr.co.e8ight.auth.jwt.TokenProvider;
import org.springframework.context.annotation.Bean;
import org.springframework.security.config.annotation.method.configuration.EnableGlobalMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.builders.WebSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configuration.WebSecurityConfigurerAdapter;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.filter.CorsFilter;

import javax.servlet.Filter;


@EnableWebSecurity
@EnableGlobalMethodSecurity(prePostEnabled = true)
public class SecurityConfig extends WebSecurityConfigurerAdapter {
    private final TokenProvider tokenProvider;
    private final CorsFilter corsFilter;
    private final JwtAuthenticationEntryPoint jwtAuthenticationEntryPoint;
    private final JwtAccessDeniedHandler jwtAccessDeniedHandler;

    public SecurityConfig(
            TokenProvider tokenProvider,
            CorsFilter corsFilter,
            JwtAuthenticationEntryPoint jwtAuthenticationEntryPoint,
            JwtAccessDeniedHandler jwtAccessDeniedHandler
    ) {
        this.tokenProvider = tokenProvider;
        this.corsFilter = corsFilter;
        this.jwtAuthenticationEntryPoint = jwtAuthenticationEntryPoint;
        this.jwtAccessDeniedHandler = jwtAccessDeniedHandler;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

//    h2 database가 security 로직이 타지 않도록 ignore
    @Override
    public void configure(WebSecurity web) {
        web.ignoring()
                .antMatchers(
                        "/favicon.ico"
                        ,"/error"
                        ,"/swagger-ui/**"
                        ,"/swagger-ui.html"
                        ,"/v3/api-docs/**"
                );
    }

    @Override
    protected void configure(HttpSecurity httpSecurity) throws Exception {
        httpSecurity
                // token을 사용하기 위해 disable()
                .csrf().disable()

                .addFilterBefore(corsFilter, UsernamePasswordAuthenticationFilter.class)

                .exceptionHandling()
                .authenticationEntryPoint(jwtAuthenticationEntryPoint)
                .accessDeniedHandler(jwtAccessDeniedHandler)

                // enable h2-console
                .and()
                .headers()
                .frameOptions()
                .sameOrigin()

                // 세션을 사용하지 않기 때문에 세션설정 stateless
                .and()
                .sessionManagement()
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS)

                .and()
                .authorizeRequests() //요청에 대해서 보안을 하겠다.
                .antMatchers("/ndxpro/v1/auth/login").permitAll()
                .antMatchers("/ndxpro/v1/auth/signup").permitAll()
        .antMatchers("/ndxpro/v1/auth/**").permitAll()
//                .antMatchers("/swagger-ui.html").permitAll()

//                나머지 요청들은 모두 인증되어야 함
                .anyRequest().authenticated()

//                jwtFilter를 addFilterBefore 메소드를 등록해줬던 jwtSecurityConfig 클래스로 적용
                .and()
                .apply(new JwtSecurityConfig(tokenProvider));
    }
}