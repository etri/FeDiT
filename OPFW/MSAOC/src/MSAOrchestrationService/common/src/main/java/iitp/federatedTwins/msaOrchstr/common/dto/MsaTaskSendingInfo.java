package iitp.federatedTwins.msaOrchstr.common.dto;

/**
 * @파일명 : MsaTaskSendingInfo.java
 * @title : 제어시퀀스 요청정보 전송 정보
 * @작성일 : 2023. 07. 26.
 * @작성자 : 오세광
 * @description :
 */
public class MsaTaskSendingInfo {

	private int taskSendingId;

	private int taskProcessingId;

	private int ctrlCmdSequenceId;

	private int requestControlCommandId;

	private String taskConnectionUrl;

	private String taskSendingControlCommandParam;

	private String taskSendingControlCommand;

	private String taskSendingTime;

	private String taskSendingStatus;

	private String taskReceiveResultMsg;

	private String taskSendingIdentifiier;

	public int getTaskSendingId() {
		return taskSendingId;
	}

	public void setTaskSendingId(int taskSendingId) {
		this.taskSendingId = taskSendingId;
	}

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

	public String getTaskConnectionUrl() {
		return taskConnectionUrl;
	}

	public void setTaskConnectionUrl(String taskConnectionUrl) {
		this.taskConnectionUrl = taskConnectionUrl;
	}

	public String getTaskSendingControlCommandParam() {
		return taskSendingControlCommandParam;
	}

	public void setTaskSendingControlCommandParam(String taskSendingControlCommandParam) {
		this.taskSendingControlCommandParam = taskSendingControlCommandParam;
	}

	public String getTaskSendingControlCommand() {
		return taskSendingControlCommand;
	}

	public void setTaskSendingControlCommand(String taskSendingControlCommand) {
		this.taskSendingControlCommand = taskSendingControlCommand;
	}

	public String getTaskSendingTime() {
		return taskSendingTime;
	}

	public void setTaskSendingTime(String taskSendingTime) {
		this.taskSendingTime = taskSendingTime;
	}

	public String getTaskSendingStatus() {
		return taskSendingStatus;
	}

	public void setTaskSendingStatus(String taskSendingStatus) {
		this.taskSendingStatus = taskSendingStatus;
	}

	public String getTaskSendingIdentifiier() {
		return taskSendingIdentifiier;
	}

	public void setTaskSendingIdentifiier(String taskSendingIdentifiier) {
		this.taskSendingIdentifiier = taskSendingIdentifiier;
	}

	public String getTaskReceiveResultMsg() {
		return taskReceiveResultMsg;
	}

	public void setTaskReceiveResultMsg(String taskReceiveResultMsg) {
		this.taskReceiveResultMsg = taskReceiveResultMsg;
	}

}
