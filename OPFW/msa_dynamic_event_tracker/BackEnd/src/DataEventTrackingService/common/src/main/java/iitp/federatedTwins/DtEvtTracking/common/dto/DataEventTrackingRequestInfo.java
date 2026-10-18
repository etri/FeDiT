package iitp.federatedTwins.DtEvtTracking.common.dto;

public class DataEventTrackingRequestInfo {

	private int requestTrackingId;
	private String trackingIdentifier;
	private String reqIdentifier;
	private String reqTrckCmdTime;
	private String reqTrckCmdStatus;
	private String resultCallbackUrl;
	private String reqTrackingCmd;
	private String reqStatusChangeTime;

	public String getReqTrckCmdTime() {
		return reqTrckCmdTime;
	}

	public void setReqTrckCmdTime(String reqTrckCmdTime) {
		this.reqTrckCmdTime = reqTrckCmdTime;
	}

	public String getReqTrckCmdStatus() {
		return reqTrckCmdStatus;
	}

	public void setReqTrckCmdStatus(String reqTrckCmdStatus) {
		this.reqTrckCmdStatus = reqTrckCmdStatus;
	}

	public String getResultCallbackUrl() {
		return resultCallbackUrl;
	}

	public void setResultCallbackUrl(String resultCallbackUrl) {
		this.resultCallbackUrl = resultCallbackUrl;
	}

	public String getReqTrackingCmd() {
		return reqTrackingCmd;
	}

	public void setReqTrackingCmd(String reqTrackingCmd) {
		this.reqTrackingCmd = reqTrackingCmd;
	}

	public String getTrackingIdentifier() {
		return trackingIdentifier;
	}

	public void setTrackingIdentifier(String trackingIdentifier) {
		this.trackingIdentifier = trackingIdentifier;
	}

	public String getReqStatusChangeTime() {
		return reqStatusChangeTime;
	}

	public void setReqStatusChangeTime(String reqStatusChangeTime) {
		this.reqStatusChangeTime = reqStatusChangeTime;
	}

	public String getReqIdentifier() {
		return reqIdentifier;
	}

	public void setReqIdentifier(String reqIdentifier) {
		this.reqIdentifier = reqIdentifier;
	}

	public int getRequestTrackingId() {
		return requestTrackingId;
	}

	public void setRequestTrackingId(int requestTrackingId) {
		this.requestTrackingId = requestTrackingId;
	}

}
