package iitp.federatedTwins.DtEvtTracking.common.dto;

public class TrackingResponseRecord {

	private int trackingResponseId;
	private int trackingProcessId;
	private int requestTrackingId;
	private String receiveTime;
	private String receiveVal;
	private String receiveStatus;
	private String receiveMsg;
	private String receivePayload;

	public String getReceiveTime() {
		return receiveTime;
	}

	public void setReceiveTime(String receiveTime) {
		this.receiveTime = receiveTime;
	}

	public String getReceiveVal() {
		return receiveVal;
	}

	public void setReceiveVal(String receiveVal) {
		this.receiveVal = receiveVal;
	}

	public String getReceiveStatus() {
		return receiveStatus;
	}

	public void setReceiveStatus(String receiveStatus) {
		this.receiveStatus = receiveStatus;
	}

	public String getReceiveMsg() {
		return receiveMsg;
	}

	public void setReceiveMsg(String receiveMsg) {
		this.receiveMsg = receiveMsg;
	}

	public int getRequestTrackingId() {
		return requestTrackingId;
	}

	public void setRequestTrackingId(int requestTrackingId) {
		this.requestTrackingId = requestTrackingId;
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

	public String getReceivePayload() {
		return receivePayload;
	}

	public void setReceivePayload(String receivePayload) {
		this.receivePayload = receivePayload;
	}

	
}
