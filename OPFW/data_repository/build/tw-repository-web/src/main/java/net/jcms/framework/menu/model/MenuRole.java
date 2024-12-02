package net.jcms.framework.menu.model;
 
import net.jcms.framework.base.model.BaseModel;

public class MenuRole extends BaseModel{

	private String roleAuth;
	private Long menuId;
	
	public String getRoleAuth() {
		return roleAuth;
	}
	public void setRoleAuth(String roleAuth) {
		this.roleAuth = roleAuth;
	}
	public Long getMenuId() {
		return menuId;
	}
	public void setMenuId(Long menuId) {
		this.menuId = menuId;
	}
	
}
