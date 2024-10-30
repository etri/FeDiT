package com.stoneitgt.dt.data.platform.admin.component;

import java.util.Collection;

import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import com.stoneitgt.dt.data.platform.domain.User;
import com.stoneitgt.dt.data.platform.security.Role;


@Component
public class AuthenticationFacade implements IAuthenticationFacade {

	@Override
	public Authentication getAuthentication() {
		return SecurityContextHolder.getContext().getAuthentication();
	}

	@Override
	public User getLoginUser() {
		return getAuthentication() != null ? (User) getAuthentication().getPrincipal() : null;
	}

	@Override
	public String getLoginUserId() {
		return getLoginUser().getId();
	}
	
	@Override
	public String getLoginUserIp() {
		return getLoginUser().getLoginUserIp();
	}

	@Override
	public int getLoginUserSeq() {
		return getLoginUser().getUserSeq();
	}

	@Override
	public String getAuth() {
		return getLoginUser().getUserAuthCd();
	}

	@Override
	public boolean isAuthenticated() {
		return !isAnonymous();
	}

	public boolean isAnonymous() {
		if (AnonymousAuthenticationToken.class == null || getAuthentication() == null) {
			return false;
		}
		return AnonymousAuthenticationToken.class.isAssignableFrom(getAuthentication().getClass());
	}

	@Override
	public boolean isAdmin() {
		if (isAuthenticated() && getLoginUser() != null) {
			Collection<? extends GrantedAuthority> authorities = getLoginUser().getAuthorities();
			return authorities.stream().anyMatch(x -> Role.ADMIN.getValue().equals(x.getAuthority())	);
		}
		return false;
	}
}
