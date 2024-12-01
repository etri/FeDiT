package net.jcms.framework.security.handler;

import net.jcms.framework.security.model.User;
import net.jcms.framework.security.model.UserSearch;
import net.jcms.framework.security.service.UserService;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.authentication.AuthenticationFailureHandler;

import javax.annotation.Resource;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;
import java.io.IOException;


public class LoginFailureHandler implements AuthenticationFailureHandler{
	
	@Resource (name="userService")
	private UserService userService;

	private String redirectUrl;

	public LoginFailureHandler(String redirectUrl) {
		this.redirectUrl = redirectUrl;
	}

	@Override
	public void onAuthenticationFailure(HttpServletRequest request,
			HttpServletResponse response, AuthenticationException arg2)
			throws IOException {
		
		UserSearch userSearch = new UserSearch();
		userSearch.setUserLoginId(request.getParameter ("userLoginId"));
		User user = userService.select(userSearch);


		
		HttpServletRequest httpRequest = request;
		HttpSession session = httpRequest.getSession();
		String URL = (String) session.getAttribute("loginRequestURL");
		
		int error = -1; // 기본 로그인 실패 원인은 아이디/비밀번호 오류
		if(user != null && user.getFailCnt () > 5) { // 로그인 실패 횟수가 5회가 이상인 경우
			user.setFailCnt(user.getFailCnt()+1);

			userService.updateUserLoginFail(user);

			error = -2;
		}
		if(("login").equals(URL)){
			response.sendRedirect("/login.do?error="+ error);
		}else{
			response.sendRedirect(redirectUrl+"?error="+ error);
		}
	}

}
