package iitp.federatedTwins.DtEvtTracking.common.dto;

/**
 * @파일명 : EventTransmissionResultInfo.java
 * @title : 트래킹 이벤트 발생 전송 정보
 * @작성일 : 2023. 11. 16.
 * @작성자 : 오세광
 * @description :
 */
public class EventTransmissionResultInfo {

	/**
	 * 
	 * 트래킹 이벤트 발생 전송 처리 결과 ID
	 */
	private int evnetTransMissionResultId;
	/**
	 * 
	 * 이벤트 발생 ID
	 */
	private int eventOccuredId;
	/**
	 * 
	 * 트래킹 검출 Proc ID
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
	 * 이벤트 전송 상태
	 */
	private String eventTransmissionStatus;
	/**
	 * 
	 * 이벤트 전송 URL
	 */
	private String transmissionUrl;
	/**
	 * 
	 * 이벤트 전송 파라메터
	 */
	private String transmissionParam;
	/**
	 * 
	 * 이벤트 발생 MSG
	 */
	private String eventOccuredMsg;
	/**
	 * 
	 * 이벤트 전송 일시
	 */
	private String transmissionTime;
	/**
	 * 
	 * 이벤트 전송 응답 코드
	 */
	private String transmissionRespCode;
	/**
	 * 
	 * 이벤트 전송 응답 값
	 */
	private String transmissionRespMsg;

	public int getEvnetTransMissionResultId() {
		return evnetTransMissionResultId;
	}

	public void setEvnetTransMissionResultId(int evnetTransMissionResultId) {
		this.evnetTransMissionResultId = evnetTransMissionResultId;
	}

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

	public String getEventTransmissionStatus() {
		return eventTransmissionStatus;
	}

	public void setEventTransmissionStatus(String eventTransmissionStatus) {
		this.eventTransmissionStatus = eventTransmissionStatus;
	}

	public String getTransmissionUrl() {
		return transmissionUrl;
	}

	public void setTransmissionUrl(String transmissionUrl) {
		this.transmissionUrl = transmissionUrl;
	}

	public String getTransmissionParam() {
		return transmissionParam;
	}

	public void setTransmissionParam(String transmissionParam) {
		this.transmissionParam = transmissionParam;
	}

	public String getEventOccuredMsg() {
		return eventOccuredMsg;
	}

	public void setEventOccuredMsg(String eventOccuredMsg) {
		this.eventOccuredMsg = eventOccuredMsg;
	}

	public String getTransmissionTime() {
		return transmissionTime;
	}

	public void setTransmissionTime(String transmissionTime) {
		this.transmissionTime = transmissionTime;
	}

	public String getTransmissionRespCode() {
		return transmissionRespCode;
	}

	public void setTransmissionRespCode(String transmissionRespCode) {
		this.transmissionRespCode = transmissionRespCode;
	}

	public String getTransmissionRespMsg() {
		return transmissionRespMsg;
	}

	public void setTransmissionRespMsg(String transmissionRespMsg) {
		this.transmissionRespMsg = transmissionRespMsg;
	}

}
