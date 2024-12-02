package net.jcms.framework.cd.model;

import net.jcms.framework.base.model.BaseModel;

public class Cd extends BaseModel{
	private String cdId;
	private String cdClsId;
	private String cdNm;
	private String cdDesc;
	
	public String getCdId() {
		return cdId;
	}
	public void setCdId(String cdId) {
		this.cdId = cdId;
	}
	public String getCdClsId() {
		return cdClsId;
	}
	public void setCdClsId(String cdClsId) {
		this.cdClsId = cdClsId;
	}
	public String getCdNm() {
		return cdNm;
	}
	public void setCdNm(String cdNm) {
		this.cdNm = cdNm;
	}
	public String getCdDesc() {
		return cdDesc;
	}
	public void setCdDesc(String cdDesc) {
		this.cdDesc = cdDesc;
	}
	public String getUseSt() {
		return this.getRecSt();
	}
	public void setUseSt(String recSt) {
		this.setRecSt(recSt);
	}
}
