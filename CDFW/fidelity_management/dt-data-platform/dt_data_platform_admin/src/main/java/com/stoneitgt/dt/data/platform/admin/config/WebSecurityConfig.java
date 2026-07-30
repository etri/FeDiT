package com.stoneitgt.dt.data.platform.admin.config;

import com.stoneitgt.dt.data.platform.admin.Filter.AutoLoginFilter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.web.servlet.ServletListenerRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.authentication.builders.AuthenticationManagerBuilder;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.builders.WebSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configuration.WebSecurityConfigurerAdapter;
import org.springframework.security.core.session.SessionRegistry;
import org.springframework.security.core.session.SessionRegistryImpl;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.firewall.HttpFirewall;
import org.springframework.security.web.firewall.StrictHttpFirewall;
import org.springframework.security.web.session.HttpSessionEventPublisher;
import org.springframework.security.web.util.matcher.AntPathRequestMatcher;
import org.springframework.web.context.request.RequestContextListener;

import com.stoneitgt.dt.data.platform.admin.security.AuthFailureHandler;
import com.stoneitgt.dt.data.platform.admin.security.AuthProvider;
import com.stoneitgt.dt.data.platform.admin.security.AuthSuccessHandler;

/**
 * Spring Security에 대한 설정 클래스
 *
 * @author yh.kim
 */
@Configuration
@EnableWebSecurity
public class WebSecurityConfig extends WebSecurityConfigurerAdapter {

    @Autowired
    private AuthProvider authProvider;

    @Autowired
    private AuthFailureHandler authFailureHandler;

    @Autowired
    private AuthSuccessHandler authSuccessHandler;

    @Autowired
    private AutoLoginFilter autoLoginFilter;

    @Override
    public void configure(AuthenticationManagerBuilder auth) throws Exception {
        auth.authenticationProvider(authProvider);
    }

    @Bean
    public RequestContextListener requestContextListener() {
        return new RequestContextListener();
    }

    @Override
    public void configure(WebSecurity web) throws Exception {
        super.configure(web);
        web.ignoring().antMatchers("/static/**", "/assets/**", "/streaming/**", "/files/**");
        web.httpFirewall(allowUrlEncodedSlashHttpFirewall());
    }

    @Override
    protected void configure(HttpSecurity http) throws Exception {
        http.cors().and().csrf().ignoringAntMatchers("/api/session/extention", "/login");

        http.headers().frameOptions().disable();
        http.headers().httpStrictTransportSecurity().disable();

        http.authorizeRequests().antMatchers("/", "/login", "/error/**").permitAll();

        http.authorizeRequests().antMatchers("/actuator/**").hasRole("ADMIN");

        http.authorizeRequests()
                .antMatchers("/**").hasAnyRole("ADMIN", "USER")
                .anyRequest().denyAll()
                .and()
                .formLogin()
                .loginPage("/login")
                .usernameParameter("id")
                .passwordParameter("password")
                .successHandler(authSuccessHandler)
                .failureHandler(authFailureHandler)
                .and()
                .logout()
                .logoutRequestMatcher(new AntPathRequestMatcher("/logout"))
                .deleteCookies("[JSESSIONID]")
                .clearAuthentication(true)
                .invalidateHttpSession(true)
                .logoutSuccessUrl("/login");
        // 자동 로그인 필터 추가
        http.addFilterBefore(autoLoginFilter, UsernamePasswordAuthenticationFilter.class);
    }

    @Bean
    public HttpFirewall allowUrlEncodedSlashHttpFirewall() {
        StrictHttpFirewall firewall = new StrictHttpFirewall();
        firewall.setAllowUrlEncodedSlash(true);
        firewall.setAllowSemicolon(true);
        return firewall;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SessionRegistry sessionRegistry() {
        return new SessionRegistryImpl();
    }

    @Bean
    public ServletListenerRegistrationBean<HttpSessionEventPublisher> httpSessionEventPublisher() {
        return new ServletListenerRegistrationBean<HttpSessionEventPublisher>(new HttpSessionEventPublisher());
    }
}
