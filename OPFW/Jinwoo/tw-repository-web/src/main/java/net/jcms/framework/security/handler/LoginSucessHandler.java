package net.jcms.framework.security.handler;

import lombok.Setter;
import net.jcms.framework.menu.service.MenuService;
import net.jcms.framework.security.model.LoginLog;
import net.jcms.framework.security.model.User;
import net.jcms.framework.security.service.LoginLogService;
import net.jcms.framework.security.service.UserService;
import net.jcms.framework.security.springExt.UserDetailsImpl;
import net.jcms.framework.util.HttpUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;

import javax.annotation.Resource;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;
import java.io.IOException;

public class LoginSucessHandler implements AuthenticationSuccessHandler{
	
	@Resource (name="userService")
	private UserService userService;
	
	@Resource (name="loginLogService")
	private LoginLogService loginLogService;

	@Autowired
	private MenuService menuService;

	@Setter
	private String defaultUrl;

	@Override
	public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
			Authentication authentication) throws IOException, ServletException {

		UserDetailsImpl userDetails = (UserDetailsImpl)authentication.getPrincipal();
		User user = userDetails.getUser();
		
		LoginLog loginLog = new LoginLog();
		loginLog.getUser().setUserId(user.getUserId());
		loginLog.setLoginIp(HttpUtil.getClientIp(request));
        loginLogService.insert(loginLog);
        
        HttpSession session = request.getSession();

		GrantedAuthority authority = userDetails.getAuthorities().stream().findFirst().orElseThrow(() -> new RuntimeException("no authority"));
		session.setAttribute ("user", user);
		session.setAttribute ("userRole" , authority.getAuthority());
        session.setAttribute("loginLogId", loginLog.getLoginLogId());
		session.setAttribute("failCnt", 0);

		// 오라클은 주석 처리해야 실행 updateInitUserLoginFailCnt 확인
        user.setFailCnt(0);
        userService.updateInitUserLoginFailCnt(user);

		menuService.selectRoleMenuList(user.getUserId(),true);

		response.sendRedirect(defaultUrl);
	}
}
