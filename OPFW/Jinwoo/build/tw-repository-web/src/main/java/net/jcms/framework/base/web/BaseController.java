package net.jcms.framework.base.web;

import net.jcms.framework.security.model.User;
import net.jcms.framework.security.util.UserDetailsHelper;
import org.springframework.beans.propertyeditors.StringTrimmerEditor;
import org.springframework.web.bind.WebDataBinder;
import org.springframework.web.bind.annotation.InitBinder;

public class BaseController {

	/**
	 * 빈 문자열의 파리미터인 경우 NULL 로 변경
	 * 
	 * @param binder
	 */
	@InitBinder
	public void initBinder(WebDataBinder binder) {
//	    binder.registerCustomEditor(String.class, new StringTrimmerEditor(true));
	}


	protected User getLoggedUser() {
		if("anonymousUser".equals(UserDetailsHelper.getAuthenticatedUser())) return null;
		return (User)UserDetailsHelper.getAuthenticatedUser();
	}

	/**
	 * 접속 사용자 아이디(번호)를 가져 온다.
	 * @return
	 */
	protected Long getUserId () {
		if("anonymousUser".equals(UserDetailsHelper.getAuthenticatedUser())) return null;
		
		User user = (User)UserDetailsHelper.getAuthenticatedUser();
		if (user != null) {
			return user.getUserId ();
		}
		
		return null;
	}
	
	/** 
	 * 접속 사용자의 로그인 아이디를 가져온다.
	 * @return
	 */
	protected String getUserLoginId () {
		User user = 
				(User)UserDetailsHelper.getAuthenticatedUser();
		if (user != null) {
			return user.getUserLoginId ();
		}
		return null;
	}

	
	/** 
	 * 접속한 사용자의 이름을 가져온다.
	 * 
	 * @return
	 */
	protected String getUserName () {
		User user = 
				(User)UserDetailsHelper.getAuthenticatedUser();
		if (user != null) {
			return user.getUserNm ();
		}
		return null;
	}
}
