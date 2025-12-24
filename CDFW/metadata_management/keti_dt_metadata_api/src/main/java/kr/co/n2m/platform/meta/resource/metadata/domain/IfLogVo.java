package kr.co.n2m.platform.meta.resource.metadata.domain;

import java.io.Serializable;

public class IfLogVo implements Serializable {

	private static final long serialVersionUID = 1L;
	
	private String ifLogId; 		
	private String ifLogDt; 		    
	private String ifLogKey; 	
	private String ifLogMsg;
	private String ifLogResult;
	private String ifLogThreadId;	
	private String ifLogType;
	
	public String getIfLogId() {
		return ifLogId;
	}
	public void setIfLogId(String ifLogId) {
		this.ifLogId = ifLogId;
	}
	public String getIfLogDt() {
		return ifLogDt;
	}
	public void setIfLogDt(String ifLogDt) {
		this.ifLogDt = ifLogDt;
	}
	public String getIfLogKey() {
		return ifLogKey;
	}
	public void setIfLogKey(String ifLogKey) {
		this.ifLogKey = ifLogKey;
	}
	public String getIfLogMsg() {
		return ifLogMsg;
	}
	public void setIfLogMsg(String ifLogMsg) {
		this.ifLogMsg = ifLogMsg;
	}
	public String getIfLogResult() {
		return ifLogResult;
	}
	public void setIfLogResult(String ifLogResult) {
		this.ifLogResult = ifLogResult;
	}
	public String getIfLogThreadId() {
		return ifLogThreadId;
	}
	public void setIfLogThreadId(String ifLogThreadId) {
		this.ifLogThreadId = ifLogThreadId;
	}
	public String getIfLogType() {
		return ifLogType;
	}
	public void setIfLogType(String ifLogType) {
		this.ifLogType = ifLogType;
	}
	
	@Override
	public String toString() {
		return "IfLogVo [ifLogId=" + ifLogId + ", ifLogDt=" + ifLogDt + ", ifLogType=" + ifLogType + ", ifLogKey=" + ifLogKey + ", ifLogMsg="
				+ ifLogMsg + ", ifLogResult=" + ifLogResult + ", ifLogThreadId=" + ifLogThreadId + "]";
	}
	
}
