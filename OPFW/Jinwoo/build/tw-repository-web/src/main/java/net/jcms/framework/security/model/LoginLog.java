package net.jcms.framework.security.model;

import net.jcms.framework.base.model.BaseModel;

import java.util.Date;

@SuppressWarnings ("serial")
public class LoginLog extends BaseModel {
	
	private Long userId;
	private Long loginLogId;
	private String loginIp;
	private Date loginDt;
	private Date logoutDt;
	
	private UserSearch user;
	

	public LoginLog(){
		user = new UserSearch();
	}
	
	public UserSearch getUser () {
		return user;
	}

	public void setUser (UserSearch user) {
		this.user = user;
	}
	
	public Long getLoginLogId() {
		return loginLogId;
	}
	public void setLoginLogId(Long loginLogId) {
		this.loginLogId = loginLogId;
	}
	public String getLoginIp() {
		return loginIp;
	}
	public void setLoginIp(String loginIp) {
		this.loginIp = loginIp;
	}
	public Date getLoginDt() {
		return loginDt;
	}
	public void setLoginDt(Date loginDt) {
		this.loginDt = loginDt;
	}
	public Date getLogoutDt() {
		return logoutDt;
	}
	public void setLogoutDt(Date logoutDt) {
		this.logoutDt = logoutDt;
	}

	public Long getUserId() {
		return userId;
	}

	public void setUserId(Long userId) {
		this.userId = userId;
	}
	
	
}