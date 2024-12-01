package net.jcms.framework.security.model;

import net.jcms.framework.base.model.BaseModel;

public class Role extends BaseModel{
	private String roleAuth;
	private String roleNm;
	private String roleDesc;
	
	
	public String getRoleAuth() {
		return roleAuth;
	}
	public void setRoleAuth(String roleAuth) {
		this.roleAuth = roleAuth;
	}
	
	public String getRoleNm() {
		return roleNm;
	}
	public void setRoleNm(String roleNm) {
		this.roleNm = roleNm;
	}
	public String getRoleDesc() {
		return roleDesc;
	}
	public void setRoleDesc(String roleDesc) {
		this.roleDesc = roleDesc;
	}
	
	

}
