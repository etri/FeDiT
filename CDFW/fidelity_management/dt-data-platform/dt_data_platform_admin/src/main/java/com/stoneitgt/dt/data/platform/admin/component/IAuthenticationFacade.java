package com.stoneitgt.dt.data.platform.admin.component;

import org.springframework.security.core.Authentication;

import com.stoneitgt.dt.data.platform.domain.User;


public interface IAuthenticationFacade {

	Authentication getAuthentication();

	User getLoginUser();

	String getLoginUserId();
	
	String getLoginUserIp();

	int getLoginUserSeq();

	String getAuth();

	boolean isAuthenticated();

	boolean isAdmin();
}
