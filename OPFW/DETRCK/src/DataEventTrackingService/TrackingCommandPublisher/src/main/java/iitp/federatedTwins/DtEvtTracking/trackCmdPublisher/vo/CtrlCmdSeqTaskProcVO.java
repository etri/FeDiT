package iitp.federatedTwins.DtEvtTracking.trackCmdPublisher.vo;

import iitp.federatedTwins.DtEvtTracking.common.dto.TrackingProcessInfo;

public class CtrlCmdSeqTaskProcVO extends TrackingProcessInfo {

	private int taskProcessingId;
	private String taskProcessingStatus;

	public int getTaskProcessingId() {
		return taskProcessingId;
	}

	public void setTaskProcessingId(int taskProcessingId) {
		this.taskProcessingId = taskProcessingId;
	}

	public String getTaskProcessingStatus() {
		return taskProcessingStatus;
	}

	public void setTaskProcessingStatus(String taskProcessingStatus) {
		this.taskProcessingStatus = taskProcessingStatus;
	}
}
