package iitp.federatedTwins.DtEvtTracking.common.dto;

/**
 * @파일명 : DataEventTrackingRequestInfo.java
 * @title : 동적 데이터/이벤트 트래킹 요청 정보
 * @작성일 : 2023. 11. 16.
 * @작성자 : 오세광
 * @description :
 */
public class DataEventTrackingRequestInfo {

	/**
	 * 
	 * 동적 데이터/이벤트 트래킹 요청 ID
	 */
	private int requestTrackingId;
	/**
	 * 
	 * 요청 타입
	 */
	private String trackingIdentifier;
	/**
	 * 
	 * 제어 시퀀스 전송 ID
	 */
	private String reqIdentifier;
	/**
	 * 
	 * 요청일시
	 */
	private String reqTrckCmdTime;
	/**
	 * 
	 * 요청상태
	 */
	private String reqTrckCmdStatus;
	/**
	 * 
	 * 요청처리 결과 전송 URL
	 */
	private String resultCallbackUrl;
	/**
	 * 
	 * 트래킹 요청 전문
	 */
	private String reqTrackingCmd;
	/**
	 * 
	 * 트래킹 요청 최종 처리상태 반영일시
	 */
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
