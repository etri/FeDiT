package iitp.federatedTwins.DtEvtTracking.common.dto;

/**
 * @파일명 : EventOccuredInfo.java
 * @title : 이벤트 발생 정보
 * @작성일 : 2023. 11. 16.
 * @작성자 : 오세광
 * @description :
 */
public class EventOccuredInfo {

	/**
	 * 
	 * 이벤트 발생 ID
	 */
	private int eventOccuredId;
	/**
	 * 
	 * 트래킹 검증 Proc ID
	 */
	private int detectorProcId;
	/**
	 * 
	 * 트래킹 요청 실행 ID
	 */
	private int trackingProcessId;
	/**
	 * 
	 * 동적 데이터/이벤트 트래킹 요청 ID
	 */
	private int requestTrackingId;
	/**
	 * 
	 * 이벤트 발생 일시
	 */
	private String eventOccuredTime;
	/**
	 * 
	 * 이벤트 전송 상태
	 */
	private String eventTransMittedStatus;
	/**
	 * 
	 * 이트 전송 일시
	 */
	private String eventTransmittedTime;
	/**
	 * 
	 * 이벤트 발생 MSG
	 */
	private String eventOccuredMsg;

	public int getEventOccuredId() {
		return eventOccuredId;
	}

	public void setEventOccuredId(int eventOccuredId) {
		this.eventOccuredId = eventOccuredId;
	}

	public int getDetectorProcId() {
		return detectorProcId;
	}

	public void setDetectorProcId(int detectorProcId) {
		this.detectorProcId = detectorProcId;
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

	public String getEventOccuredTime() {
		return eventOccuredTime;
	}

	public void setEventOccuredTime(String eventOccuredTime) {
		this.eventOccuredTime = eventOccuredTime;
	}

	public String getEventTransMittedStatus() {
		return eventTransMittedStatus;
	}

	public void setEventTransMittedStatus(String eventTransMittedStatus) {
		this.eventTransMittedStatus = eventTransMittedStatus;
	}

	public String getEventTransmittedTime() {
		return eventTransmittedTime;
	}

	public void setEventTransmittedTime(String eventTransmittedTime) {
		this.eventTransmittedTime = eventTransmittedTime;
	}

	public String getEventOccuredMsg() {
		return eventOccuredMsg;
	}

	public void setEventOccuredMsg(String eventOccuredMsg) {
		this.eventOccuredMsg = eventOccuredMsg;
	}

}
