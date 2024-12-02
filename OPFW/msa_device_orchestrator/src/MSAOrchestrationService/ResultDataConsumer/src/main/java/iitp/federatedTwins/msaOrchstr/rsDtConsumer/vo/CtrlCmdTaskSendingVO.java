package iitp.federatedTwins.msaOrchstr.rsDtConsumer.vo;

import iitp.federatedTwins.msaOrchstr.common.dto.MsaTaskSendingInfo;

public class CtrlCmdTaskSendingVO extends MsaTaskSendingInfo{

	/**
	 * 
	 * 시퀀스 처리 디지털 객체 ID
	 */
	private String digitalObjectId;

	/**
	 * 
	 * 제어 명령처리할 제어기ID
	 */
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
