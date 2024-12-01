package net.jcms.framework.security.model;

import lombok.Getter;
import lombok.Setter;

import java.text.DateFormat;
import java.text.SimpleDateFormat;
import java.util.Date;

public class LoginLogSearch extends LoginLog {
	
	private String userLoginIdLike;
	private String userNmLike;
	private String loginIpLike;

	@Setter @Getter
	private String startSearchDt;

	@Setter @Getter
	private String endSearchDt;

	@Setter @Getter
	private int loginCount;

	@Setter @Getter
	private Date searchDate;


	public String getConvertedSearchDate() {
		if(searchDate == null) {
			return null;
		}else {
			DateFormat sdFormat = new SimpleDateFormat("yyyy-MM-dd");
			return sdFormat.format(searchDate);
		}
	}

	public String getUserLoginIdLike() {
		return userLoginIdLike;
	}
	public void setUserLoginIdLike(String userLoginIdLike) {
		this.userLoginIdLike = userLoginIdLike;
	}
	public String getUserNmLike() {
		return userNmLike;
	}
	public void setUserNmLike(String userNmLike) {
		this.userNmLike = userNmLike;
	}
	public String getLoginIpLike() {
		return loginIpLike;
	}
	public void setLoginIpLike(String loginIpLike) {
		this.loginIpLike = loginIpLike;
	}
}


