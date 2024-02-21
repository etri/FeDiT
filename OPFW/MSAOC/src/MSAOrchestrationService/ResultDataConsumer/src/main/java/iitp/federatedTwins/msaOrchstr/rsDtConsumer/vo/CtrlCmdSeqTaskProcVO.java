package iitp.federatedTwins.msaOrchstr.rsDtConsumer.vo;

import iitp.federatedTwins.msaOrchstr.common.dto.MsaControlCommandSequenceInfo;

public class CtrlCmdSeqTaskProcVO extends MsaControlCommandSequenceInfo {

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
