package iitp.federatedTwins.DtEvtTracking.trackCmdPublisher.vo;

import iitp.federatedTwins.DtEvtTracking.common.dto.TrackingTaskSendingInfo;

public class CtrlCmdTaskSendingVO extends TrackingTaskSendingInfo {

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
