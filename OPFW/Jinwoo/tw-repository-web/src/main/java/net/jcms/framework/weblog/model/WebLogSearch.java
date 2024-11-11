package net.jcms.framework.weblog.model;

public class WebLogSearch extends WebLog {
	
	private String userLoginIdLike;
	private String userNmLike;
	
	public WebLogSearch () {
		super ();
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

}


