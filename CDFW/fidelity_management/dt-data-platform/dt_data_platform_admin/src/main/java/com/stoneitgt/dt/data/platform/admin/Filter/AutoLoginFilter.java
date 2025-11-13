package com.stoneitgt.dt.data.platform.admin.Filter;

import com.stoneitgt.dt.data.platform.admin.properties.SystemProperties;
import com.stoneitgt.dt.data.platform.admin.security.AuthProvider;
import com.stoneitgt.dt.data.platform.admin.security.AuthSuccessHandler;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import javax.servlet.FilterChain;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Arrays;

@Component
public class AutoLoginFilter extends OncePerRequestFilter {
    private final AuthSuccessHandler authSuccessHandler;
    private final AuthProvider authProvider;
    private final SystemProperties systemProperties;

    @Autowired
    public AutoLoginFilter(AuthSuccessHandler authSuccessHandler, AuthProvider authProvider, SystemProperties systemProperties) {
        this.authSuccessHandler = authSuccessHandler;
        this.authProvider = authProvider;
        this.systemProperties = systemProperties;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        // 인증되지 않은 상태에서만 자동 로그인 수행
        // Environment에서 username과 password를 읽어옴
        String username = systemProperties.getUsername();
        String password = systemProperties.getPassword();

        if (username != null && password != null && !username.trim().equals("") && !password.trim().equals("")) {
            // 이미 인증된 상태라면 더 이상 자동 로그인 필터를 실행하지 않음
            if (request.getSession().getAttribute("isAutoLogin") != null) {
                filterChain.doFilter(request, response);  // 인증된 상태라면 필터 체인을 계속 진행
                return;
            }
            // 자동 인증 정보 생성
            UserDetails userDetails = new User(username, password, Arrays.asList(new SimpleGrantedAuthority("ADMIN")));

            // 인증 정보 생성
            UsernamePasswordAuthenticationToken authentication =
                    new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());

            authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

            // 인증 처리
            request.getSession().setAttribute("isAutoLogin", true);
            Authentication authenticated = authProvider.authenticate(authentication);

            // 인증 정보 설정
            SecurityContextHolder.getContext().setAuthentication(authenticated);

            // 로그인 성공 핸들러 호출
            authSuccessHandler.onAuthenticationSuccess(request, response, authenticated);
        }
        filterChain.doFilter(request, response);
    }
}