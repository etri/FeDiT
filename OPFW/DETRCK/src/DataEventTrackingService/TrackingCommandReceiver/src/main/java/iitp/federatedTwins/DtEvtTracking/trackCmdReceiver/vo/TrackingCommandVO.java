package iitp.federatedTwins.DtEvtTracking.trackCmdReceiver.vo;


public class TrackingCommandVO {

	private String reqIdentifier;
	private String trackingIdtifier;
	private String callBackURL;
	private String reqCtrlCmdType;
	private TrackingSequencesVO trckProcInfo[];
	private int requestTrackingId;

	public String getCallBackURL() {
		return callBackURL;
	}

	public void setCallBackURL(String callBackURL) {
		this.callBackURL = callBackURL;
	}

	public String getReqCtrlCmdType() {
		return reqCtrlCmdType;
	}

	public void setReqCtrlCmdType(String reqCtrlCmdType) {
		this.reqCtrlCmdType = reqCtrlCmdType;
	}

	public int getRequestTrackingId() {
		return requestTrackingId;
	}

	public void setRequestTrackingId(int requestTrackingId) {
		this.requestTrackingId = requestTrackingId;
	}

	public String getTrackingIdtifier() {
		return trackingIdtifier;
	}

	public void setTrackingIdtifier(String trackingIdtifier) {
		this.trackingIdtifier = trackingIdtifier;
	}

	public TrackingSequencesVO[] getTrckProcInfo() {
		return trckProcInfo;
	}

	public void setTrckProcInfo(TrackingSequencesVO trckProcInfo[]) {
		this.trckProcInfo = trckProcInfo;
	}

	public String getReqIdentifier() {
		return reqIdentifier;
	}

	public void setReqIdentifier(String reqIdentifier) {
		this.reqIdentifier = reqIdentifier;
	}
}
