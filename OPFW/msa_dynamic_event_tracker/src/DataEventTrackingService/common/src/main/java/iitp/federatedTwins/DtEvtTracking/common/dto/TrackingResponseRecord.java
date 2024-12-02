package iitp.federatedTwins.DtEvtTracking.common.dto;

/**
 * @파일명 : TrackingResponseRecordInfo.java
 * @title : 제어시퀀스 요청 결과 수신 정보
 * @작성일 : 2023. 11. 16.
 * @작성자 : 오세광
 * @description :
 */
public class TrackingResponseRecord {

	private int trackingResponseId;
	private int trackingProcessId;
	/**
	 * 
	 * MSA 제어요청 ID
	 */
	private int requestTrackingId;
	
	/**
	 * 
	 * 결과 수신 일시
	 */
	private String receiveTime;
	/**
	 * 
	 * 결과 수신 값
	 */
	private String receiveVal;
	
	private Object totalReceiveVal;
	/**
	 * 
	 * 수신 상태 값
	 */
	private String receiveStatus;
	/**
	 * 
	 * 수신 상태 MSG
	 */
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

	public Object getTotalReceiveVal() {
		return totalReceiveVal;
	}

	public void setTotalReceiveVal(Object totalReceiveVal) {
		this.totalReceiveVal = totalReceiveVal;
	}

	
}
