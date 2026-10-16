package iitp.federatedTwins.DtEvtTracking.common.dto;

public class TrackingStatusChangeRecord {

	private int trackingStatusChangeId;
	private String statusUpdateTime;
	private String changeStatus;
	private String statusResultMsg;
	private int requestTrackingId;

	public int getTrackingStatusChangeId() {
		return trackingStatusChangeId;
	}

	public void setTrackingStatusChangeId(int trackingStatusChangeId) {
		this.trackingStatusChangeId = trackingStatusChangeId;
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

	public int getRequestTrackingId() {
		return requestTrackingId;
	}

	public void setRequestTrackingId(int requestTrackingId) {
		this.requestTrackingId = requestTrackingId;
	}

}
