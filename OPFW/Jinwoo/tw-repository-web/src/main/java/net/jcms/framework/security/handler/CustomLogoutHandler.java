package net.jcms.framework.security.handler;

import net.jcms.framework.security.model.LoginLog;
import net.jcms.framework.security.service.LoginLogService;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.logout.LogoutHandler;

import javax.annotation.Resource;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;

public class CustomLogoutHandler implements LogoutHandler {

    @Resource(name="loginLogService")
    private LoginLogService loginLogService;

    @Override
    public void logout(HttpServletRequest request, HttpServletResponse response, Authentication authentication) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null){
            HttpSession session = request.getSession();
            LoginLog loginLog = new LoginLog();
            loginLog.setLoginLogId((Long) session.getAttribute("loginLogId"));
            loginLogService.update(loginLog);
        }
    }
}