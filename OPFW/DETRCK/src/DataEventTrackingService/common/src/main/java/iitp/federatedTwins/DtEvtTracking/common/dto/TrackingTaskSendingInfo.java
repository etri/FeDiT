package iitp.federatedTwins.DtEvtTracking.common.dto;

public class TrackingTaskSendingInfo {

	private int taskSendingId;
	private int taskProcessingId;
	private int trackingProcessId;
	private int requestTrackingId;
	private String taskConnectionUrl;
	private String taskSendingControlCommandParam;
	private String taskSendingControlCommand;
	private String taskSendingTime;
	private String taskSendingStatus;
	private String taskReceiveResultMsg;
	private String taskSendingIdentifiier;
	private String taskReceiveResultTime;

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

	public int getTrackingProcessId() {
		return trackingProcessId;
	}

	public void setTrackingProcessId(int trackingProcessId) {
		this.trackingProcessId = trackingProcessId;
	}

	public String getTaskReceiveResultTime() {
		return taskReceiveResultTime;
	}

	public void setTaskReceiveResultTime(String taskReceiveResultTime) {
		this.taskReceiveResultTime = taskReceiveResultTime;
	}

	public int getRequestTrackingId() {
		return requestTrackingId;
	}

	public void setRequestTrackingId(int requestTrackingId) {
		this.requestTrackingId = requestTrackingId;
	}

}
