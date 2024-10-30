package net.jcms.framework.pgm.model;

import net.jcms.framework.base.model.BaseModel;

public class Pgm extends BaseModel{
	
	private Long pgmId;
	private String pgmNm;
	private String pgmDesc;
	private String pgmUrl;
	
	public Long getPgmId() {
		return pgmId;
	}

	public void setPgmId(Long pgmId) {
		this.pgmId = pgmId;
	}

	public String getPgmNm() {
		return pgmNm;
	}

	public void setPgmNm(String pgmNm) {
		this.pgmNm = pgmNm;
	}

	public String getPgmDesc() {
		return pgmDesc;
	}

	public void setPgmDesc(String pgmDesc) {
		this.pgmDesc = pgmDesc;
	}

	public String getPgmUrl() {
		return pgmUrl;
	}

	public void setPgmUrl(String pgmUrl) {
		this.pgmUrl = pgmUrl;
	}

	public String getUseSt() {
		return this.getRecSt();
	}
	public void setUseSt(String recSt) {
		this.setRecSt(recSt);
	}
}
