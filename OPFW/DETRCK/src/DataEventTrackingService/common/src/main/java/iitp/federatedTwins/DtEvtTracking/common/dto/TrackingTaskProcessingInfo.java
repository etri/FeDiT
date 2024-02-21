package iitp.federatedTwins.DtEvtTracking.common.dto;

public class TrackingTaskProcessingInfo {

	private int taskProcessingId;
	private int trackingProcessId;
	private int requestTrackingId;
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

	public int getRequestTrackingId() {
		return requestTrackingId;
	}

	public void setRequestTrackingId(int requestTrackingId) {
		this.requestTrackingId = requestTrackingId;
	}

	public int getTrackingProcessId() {
		return trackingProcessId;
	}

	public void setTrackingProcessId(int trackingProcessId) {
		this.trackingProcessId = trackingProcessId;
	}

	
}
