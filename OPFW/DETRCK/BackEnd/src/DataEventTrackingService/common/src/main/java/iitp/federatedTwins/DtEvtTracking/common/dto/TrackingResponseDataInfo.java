package iitp.federatedTwins.DtEvtTracking.common.dto;

public class TrackingResponseDataInfo {

	private int requestTrackingId;
	private int trackingProcessId;
	private String trackingProcessIdentifier;
	private String resultValue;
	
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
	public String getTrackingProcessIdentifier() {
		return trackingProcessIdentifier;
	}
	public void setTrackingProcessIdentifier(String trackingProcessIdentifier) {
		this.trackingProcessIdentifier = trackingProcessIdentifier;
	}
	public String getResultValue() {
		return resultValue;
	}
	public void setResultValue(String resultValue) {
		this.resultValue = resultValue;
	}

}
