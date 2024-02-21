package iitp.federatedTwins.msaOrchstr.common.dto;

/**
 * @파일명 : MsaTaskProcessingInfo.java
 * @title : 제어시퀀스 Proc 정보
 * @작성일 : 2023. 07. 20.
 * @작성자 : 오세광
 * @description :
 */
public class MsaTaskProcessingInfo {

	private int taskProcessingId;

	private int ctrlCmdSequenceId;

	private int requestControlCommandId;

	private String taskProcessingStartTime;

	private String taskProcessingResultMsg;

	private String taskProcessingStatus;

	private String taskProcessingEndTime;

	public int getTaskProcessingId() {
		return taskProcessingId;
	}

	public void setTaskProcessingId(int taskProcessingId) {
		this.taskProcessingId = taskProcessingId;
	}

	public int getCtrlCmdSequenceId() {
		return ctrlCmdSequenceId;
	}

	public void setCtrlCmdSequenceId(int ctrlCmdSequenceId) {
		this.ctrlCmdSequenceId = ctrlCmdSequenceId;
	}

	public int getRequestControlCommandId() {
		return requestControlCommandId;
	}

	public void setRequestControlCommandId(int requestControlCommandId) {
		this.requestControlCommandId = requestControlCommandId;
	}

	public String getTaskProcessingStartTime() {
		return taskProcessingStartTime;
	}

	public void setTaskProcessingStartTime(String taskProcessingStartTime) {
		this.taskProcessingStartTime = taskProcessingStartTime;
	}

	public String getTaskProcessingResultMsg() {
		return taskProcessingResultMsg;
	}

	public void setTaskProcessingResultMsg(String taskProcessingResultMsg) {
		this.taskProcessingResultMsg = taskProcessingResultMsg;
	}

	public String getTaskProcessingStatus() {
		return taskProcessingStatus;
	}

	public void setTaskProcessingStatus(String taskProcessingStatus) {
		this.taskProcessingStatus = taskProcessingStatus;
	}

	public String getTaskProcessingEndTime() {
		return taskProcessingEndTime;
	}

	public void setTaskProcessingEndTime(String taskProcessingEndTime) {
		this.taskProcessingEndTime = taskProcessingEndTime;
	}

}
