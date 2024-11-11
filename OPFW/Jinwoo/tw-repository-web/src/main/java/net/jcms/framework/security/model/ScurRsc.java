package net.jcms.framework.security.model;

import net.jcms.framework.base.model.BaseModel;

public class ScurRsc extends BaseModel{
	private String rscId;
	private String rscNm;
	private String rscTp;
	private String rscPatn;
	private String rscDesc;
	
	public String getRscId() {
		return rscId;
	}
	public void setRscId(String rscId) {
		this.rscId = rscId;
	}
	public String getRscNm() {
		return rscNm;
	}
	public void setRscNm(String rscNm) {
		this.rscNm = rscNm;
	}
	public String getRscTp() {
		return rscTp;
	}
	public void setRscTp(String rscTp) {
		this.rscTp = rscTp;
	}
	public String getRscPatn() {
		return rscPatn;
	}
	public void setRscPatn(String rscPatn) {
		this.rscPatn = rscPatn;
	}
	public String getRscDesc() {
		return rscDesc;
	}
	public void setRscDesc(String rscDesc) {
		this.rscDesc = rscDesc;
	}
}