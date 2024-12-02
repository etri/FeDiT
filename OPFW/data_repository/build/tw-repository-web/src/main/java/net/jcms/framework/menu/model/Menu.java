package net.jcms.framework.menu.model;

import lombok.Getter;
import lombok.Setter;
import net.jcms.framework.base.model.BaseModel;
import net.jcms.framework.pgm.model.Pgm;
import net.jcms.framework.util.StrUtil;

import java.util.List;

public class Menu extends BaseModel{

	private Long menuId;
	private String menuNm;

	@Getter
	@Setter
	private Boolean onlySystem;
	private Long upperMenuId;
	private Long pgmId;
	private String menuDesc;
	private Integer menuOrd;
	private String icon;

	private Menu upperMenu;
	public List<Menu> childList;
	private Pgm pgm;
	private String pgmPath;
	
	public List<String> roleAuth;
	
	public Long getMenuId() {
		return menuId;
	}
	public void setMenuId(Long menuId) {
		this.menuId = menuId;
	}
	public String getMenuNm() {
		return menuNm;
	}
	public void setMenuNm(String menuNm) {
		this.menuNm = menuNm;
	}
	public Long getUpperMenuId() {
		return upperMenuId;
	}
	public void setUpperMenuId(Long upperMenuId) {
		this.upperMenuId = upperMenuId;
	}
	public Long getPgmId() {
		return pgmId;
	}
	public void setPgmId(Long pgmId) {
		this.pgmId = pgmId;
	}
	public String getMenuDesc() {
		return menuDesc;
	}
	public void setMenuDesc(String menuDesc) {
		this.menuDesc = menuDesc;
	}
	public Integer getMenuOrd() {
		return menuOrd;
	}
	public void setMenuOrd(Integer menuOrd) {
		this.menuOrd = menuOrd;
	}
	public String getIcon() {
		return icon;
	}
	public void setIcon(String icon) {
		this.icon = icon;
	}
	public Menu getUpperMenu() {
		return upperMenu;
	}
	public void setUpperMenu(Menu upperMenu) {
		this.upperMenu = upperMenu;
	}
	public List<String> getRoleAuth() {
		return roleAuth;
	}
	public void setRoleAuth(List<String> roleAuth) {
		this.roleAuth = roleAuth;
	}
	
	public Pgm getPgm() {
		return pgm;
	}
	public void setPgm(Pgm pgm) {
		this.pgm = pgm;
		pgmPath = _getPgmPath(pgm);
	}
	private String _getPgmPath(Pgm pgm) {
		if(pgm == null) return "";
		return getUrlPath(pgm.getPgmUrl());
	}
	public static String getUrlPath(String url) {
		if(StrUtil.isEmpty(url)) return "";
		int idx = url.lastIndexOf("/");
		if(idx < 1) return "";
		return url.substring(0, idx+1);
	}
	public static String getUrlExt(String url) {
		if(StrUtil.isEmpty(url)) return "";
		int idx = url.lastIndexOf(".");
		if(idx < 1) return "";
		return url.substring(idx);
	}
	public String getPgmPath() {
		return pgmPath;
	}	
}
