package iitp.federatedTwins.DtEvtTracking.common.dto;

/**
 * @파일명 : TrackingDetectorProcInfo.java
 * @title : 데이터/이벤트 트래킹 검출 Proc 정보
 * @작성일 : 2023. 11. 16.
 * @작성자 : 오세광
 * @description :
 */
public class TrackingDetectorProcInfo {

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
	 * 트래킹 검출 진행 상태
	 */
	private String detectedStatus;
	/**
	 * 
	 * 이벤트 발생 여부
	 */
	private String eventOccuredStatus;
	/**
	 * 
	 * 검출 트래킹 데이터 시작ID_결과 수신값
	 */
	private int detectRecordStartId;
	/**
	 * 
	 * 검출 트래킹 데이터 종료ID_결과 수신값
	 */
	private int detectRecordEndId;
	/**
	 * 
	 * 트래킹 검출 시작일시
	 */
	private String trackingStartDate;
	/**
	 * 
	 * 트래킹 검출 종료일시
	 */
	private String trackingEndDate;
	
	private String trackingResultValue;

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

	public String getDetectedStatus() {
		return detectedStatus;
	}

	public void setDetectedStatus(String detectedStatus) {
		this.detectedStatus = detectedStatus;
	}

	public String getEventOccuredStatus() {
		return eventOccuredStatus;
	}

	public void setEventOccuredStatus(String eventOccuredStatus) {
		this.eventOccuredStatus = eventOccuredStatus;
	}

	public int getDetectRecordStartId() {
		return detectRecordStartId;
	}

	public void setDetectRecordStartId(int detectRecordStartId) {
		this.detectRecordStartId = detectRecordStartId;
	}

	public int getDetectRecordEndId() {
		return detectRecordEndId;
	}

	public void setDetectRecordEndId(int detectRecordEndId) {
		this.detectRecordEndId = detectRecordEndId;
	}

	public String getTrackingStartDate() {
		return trackingStartDate;
	}

	public void setTrackingStartDate(String trackingStartDate) {
		this.trackingStartDate = trackingStartDate;
	}

	public String getTrackingEndDate() {
		return trackingEndDate;
	}

	public void setTrackingEndDate(String trackingEndDate) {
		this.trackingEndDate = trackingEndDate;
	}

	public String getTrackingResultValue() {
		return trackingResultValue;
	}

	public void setTrackingResultValue(String trackingResultValue) {
		this.trackingResultValue = trackingResultValue;
	}

}
