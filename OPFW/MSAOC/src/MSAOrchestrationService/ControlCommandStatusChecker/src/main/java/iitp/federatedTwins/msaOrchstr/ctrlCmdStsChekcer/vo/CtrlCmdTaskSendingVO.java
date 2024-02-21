package iitp.federatedTwins.msaOrchstr.ctrlCmdStsChekcer.vo;

import iitp.federatedTwins.msaOrchstr.common.dto.MsaTaskSendingInfo;

public class CtrlCmdTaskSendingVO extends MsaTaskSendingInfo {

	private String digitalObjectId;

	private String digitalControlId;

	public String getDigitalObjectId() {
		return digitalObjectId;
	}

	public void setDigitalObjectId(String digitalObjectId) {
		this.digitalObjectId = digitalObjectId;
	}

	public String getDigitalControlId() {
		return digitalControlId;
	}

	public void setDigitalControlId(String digitalControlId) {
		this.digitalControlId = digitalControlId;
	}
}
