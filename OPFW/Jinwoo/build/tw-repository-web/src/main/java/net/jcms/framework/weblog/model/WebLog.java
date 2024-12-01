package net.jcms.framework.weblog.model;

import net.jcms.framework.base.model.BaseModel;
import net.jcms.framework.security.model.LoginLog;
import net.jcms.framework.security.model.UserSearch;

@SuppressWarnings ("serial")
public class WebLog extends BaseModel {

	private Long webLogId;
	private String reqUrl;
	private String reqMthd;
	private String reqParam;
	private String pgmId;
	private String reqIp;
	private String reqTp;

	private UserSearch user;
	private LoginLog loginLog;

	public WebLog () {
		user = new UserSearch ();
		loginLog = new LoginLog ();
	}

	public UserSearch getUser () {
		return user;
	}

	public void setUser (UserSearch user) {
		this.user = user;
	}

	public LoginLog getLoginLog () {
		return loginLog;
	}

	public void setLoginLog (LoginLog loginLog) {
		this.loginLog = loginLog;
	}

	public String getPgmId () {
		return pgmId;
	}

	public void setPgmId (String pgmId) {
		this.pgmId = pgmId;
	}

	public Long getWebLogId () {
		return webLogId;
	}

	public void setWebLogId (Long webLogId) {
		this.webLogId = webLogId;
	}

	public String getReqUrl () {
		return reqUrl;
	}

	public void setReqUrl (String reqUrl) {
		this.reqUrl = reqUrl;
	}

	public String getReqMthd () {
		return reqMthd;
	}

	public void setReqMthd (String reqMthd) {
		this.reqMthd = reqMthd;
	}

	public String getReqParam () {
		return reqParam;
	}

	public void setReqParam (String reqParam) {
		this.reqParam = reqParam;
	}

	public String getReqIp () {
		return reqIp;
	}

	public void setReqIp (String reqIp) {
		this.reqIp = reqIp;
	}

	public String getReqTp () {
		return reqTp;
	}

	public void setReqTp (String reqTp) {
		this.reqTp = reqTp;
	}
}