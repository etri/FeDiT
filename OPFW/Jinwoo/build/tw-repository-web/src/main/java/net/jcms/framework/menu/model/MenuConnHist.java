package net.jcms.framework.menu.model;

import net.jcms.framework.base.model.BaseModel;

import java.text.DateFormat;
import java.text.SimpleDateFormat;
import java.util.Date;

public class MenuConnHist extends BaseModel{

	private Long menuConnHistId;
	private Long menuId;
	private String menuConnIp;
	private int menuCount;
	private float percent; 
	private String startRegDt;
	private String endRegDt;
	private Long siteId;
	
	
	public String getrRegDtString() {
		if(getRegDt() == null) {
			return null;
		}else {
			DateFormat sdFormat = new SimpleDateFormat("yyyy-MM-dd");
			return sdFormat.format(getRegDt());
		}
	}
	public Long getMenuConnHistId() {
		return menuConnHistId;
	}
	public void setMenuConnHistId(Long menuConnHistId) {
		this.menuConnHistId = menuConnHistId;
	}
	public Long getMenuId() {
		return menuId;
	}
	public void setMenuId(Long menuId) {
		this.menuId = menuId;
	}
	public String getMenuConnIp() {
		return menuConnIp;
	}
	public void setMenuConnIp(String menuConnIp) {
		this.menuConnIp = menuConnIp;
	}
	public int getMenuCount() {
		return menuCount;
	}
	public void setMenuCount(int menuCount) {
		this.menuCount = menuCount;
	}
	public float getPercent() {
		return percent;
	}
	public void setPercent(float percent) {
		this.percent = percent;
	}
	public Long getSiteId() {
		return siteId;
	}
	public void setSiteId(Long siteId) {
		this.siteId = siteId;
	}
	public String getStartRegDt() {
		return startRegDt;
	}
	public void setStartRegDt(String startRegDt) {
		this.startRegDt = startRegDt;
	}
	public String getEndRegDt() {
		return endRegDt;
	}
	public void setEndRegDt(String endRegDt) {
		this.endRegDt = endRegDt;
	}
	
	
	
	
}
