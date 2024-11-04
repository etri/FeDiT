package iitp.federatedTwins.DtEvtTracking.trackCmdReceiver.vo;

/**
 * @파일명 : ControlCommandVO.java
 * @작성일 : 2023. 07. 20.
 * @작성자 : 오세광
 * @변경이력 :
 * @description :
 */

public class TrackingCommandVO {
	/*
	 * 
	 */
	private String reqIdentifier;
	private String trackingIdtifier;
	private String callBackURL;
	private TrackingProcessVO trckProcInfo[];

	
	/**
	 * 등록이후 생성되는 제어요청ID, 시퀀스 정보 등록에 사용하기 위하여 변수 생성
	 */
	private int requestTrackingId;

	public String getCallBackURL() {
		return callBackURL;
	}

	public void setCallBackURL(String callBackURL) {
		this.callBackURL = callBackURL;
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

	public TrackingProcessVO[] getTrckProcInfo() {
		return trckProcInfo;
	}

	public void setTrckProcInfo(TrackingProcessVO trckProcInfo[]) {
		this.trckProcInfo = trckProcInfo;
	}

	public String getReqIdentifier() {
		return reqIdentifier;
	}

	public void setReqIdentifier(String reqIdentifier) {
		this.reqIdentifier = reqIdentifier;
	}
}
