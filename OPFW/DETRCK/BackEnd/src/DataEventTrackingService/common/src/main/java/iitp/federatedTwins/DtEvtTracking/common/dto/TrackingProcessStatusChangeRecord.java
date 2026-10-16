package iitp.federatedTwins.DtEvtTracking.common.dto;

public class TrackingProcessStatusChangeRecord {

	private int processStatusChangeId;
	private int requestTrackingId;
	private int trackingProcessId;
	private String statusUpdateTime;
	private String changeStatus;
	private String statusResultMsg;

	private int trackingResponseId;

	public int getProcessStatusChangeId() {
		return processStatusChangeId;
	}

	public void setProcessStatusChangeId(int processStatusChangeId) {
		this.processStatusChangeId = processStatusChangeId;
	}

	public String getStatusUpdateTime() {
		return statusUpdateTime;
	}

	public void setStatusUpdateTime(String statusUpdateTime) {
		this.statusUpdateTime = statusUpdateTime;
	}

	public String getChangeStatus() {
		return changeStatus;
	}

	public void setChangeStatus(String changeStatus) {
		this.changeStatus = changeStatus;
	}

	public String getStatusResultMsg() {
		return statusResultMsg;
	}

	public void setStatusResultMsg(String statusResultMsg) {
		this.statusResultMsg = statusResultMsg;
	}

	public int getTrackingResponseId() {
		return trackingResponseId;
	}

	public void setTrackingResponseId(int trackingResponseId) {
		this.trackingResponseId = trackingResponseId;
	}

	public int getTrackingProcessId() {
		return trackingProcessId;
	}

	public void setTrackingProcessId(int trackingProcessId) {
		this.trackingProcessId = trackingProcessId;
	}

	public int getRequestTrackingId() {
		return requestTrackingId;
	}

	public void setRequestTrackingId(int requestTrackingId) {
		this.requestTrackingId = requestTrackingId;
	}

}
