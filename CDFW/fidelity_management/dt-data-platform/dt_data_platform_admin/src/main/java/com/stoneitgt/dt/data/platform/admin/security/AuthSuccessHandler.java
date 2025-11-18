package com.stoneitgt.dt.data.platform.admin.security;

import java.io.IOException;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.DefaultRedirectStrategy;
import org.springframework.security.web.RedirectStrategy;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.security.web.savedrequest.HttpSessionRequestCache;
import org.springframework.security.web.savedrequest.RequestCache;
import org.springframework.security.web.savedrequest.SavedRequest;
import org.springframework.stereotype.Component;

import com.stoneitgt.dt.data.platform.admin.service.MenuService;
import com.stoneitgt.dt.data.platform.domain.User;
import com.stoneitgt.common.GlobalConstant;

import lombok.extern.slf4j.Slf4j;

/**
 * 로그인 성공 핸들러
 *
 * @author yh.kim
 */
@Slf4j
@Component
public class AuthSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    @Autowired
    private MenuService menuService;

    private RedirectStrategy redirectStrategy = new DefaultRedirectStrategy();
    private RequestCache requestCache = new HttpSessionRequestCache();

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
                                        Authentication authentication) throws ServletException, IOException {

        log.info("onAuthenticationSuccess");


        User user = (User) authentication.getPrincipal();
        //log.info("user::" + user);
        // 사용자 메뉴 권한
        user.setAuthMenu(menuService.getUserMenuList(user.getUserAuthCd()));

        //사용자 ip set
        String ip = request.getHeader("X-FORWARDED-FOR");
        if (ip == null) {
            ip = request.getRemoteAddr();
        }
        user.setLoginUserIp(ip);

        // session setting
        request.getSession().setAttribute(GlobalConstant.SESSION_ADMIN_KEY, user);

        response.setStatus(HttpServletResponse.SC_OK);

        resultRedirectStrategy(request, response, authentication);
    }

    protected void resultRedirectStrategy(HttpServletRequest request, HttpServletResponse response,
                                          Authentication authentication) throws IOException, ServletException {
        SavedRequest savedRequest = requestCache.getRequest(request, response);
        if (request.getSession().getAttribute("isAutoLogin") == null || !Boolean.parseBoolean(request.getSession().getAttribute("isAutoLogin").toString())) {
            if (savedRequest != null) {
                String targetUrl = savedRequest.getRedirectUrl();
                redirectStrategy.sendRedirect(request, response, targetUrl);
            } else {
                redirectStrategy.sendRedirect(request, response, "/main");
            }
        }
    }
}