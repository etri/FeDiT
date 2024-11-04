package iitp.federatedTwins.DtEvtTracking.common.dto;

/**
 * @파일명 : TrackingTaskProcessingInfo.java
 * @title : 동적데이터 요청 Proc 정보
 * @작성일 : 2023. 11. 16.
 * @작성자 : 오세광
 * @description :
 */
public class TrackingTaskProcessingInfo {

	/**
	 * 
	 * 동적데이터 요청 ProcId
	 */
	private int taskProcessingId;
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
	 * 트래킹 요청 Proc 실행 시작일시
	 */
	private String taskProcessingStartTime;
	/**
	 * 
	 * 트래킹 요청 Proc 실행 처리 결과 MSG
	 */
	private String taskProcessingResultMsg;
	/**
	 * 
	 * 트래킹 요청 Proc 실행 처리 결과 상태
	 */
	private String taskProcessingStatus;
	/**
	 * 
	 * 트래킹 요청 Proc 실행 종료일시
	 */
	private String taskProcessingEndTime;

	public int getTaskProcessingId() {
		return taskProcessingId;
	}

	public void setTaskProcessingId(int taskProcessingId) {
		this.taskProcessingId = taskProcessingId;
	}

	public String getTaskProcessingStartTime() {
		return taskProcessingStartTime;
	}

	public void setTaskProcessingStartTime(String taskProcessingStartTime) {
		this.taskProcessingStartTime = taskProcessingStartTime;
	}

	public String getTaskProcessingResultMsg() {
		return taskProcessingResultMsg;
	}

	public void setTaskProcessingResultMsg(String taskProcessingResultMsg) {
		this.taskProcessingResultMsg = taskProcessingResultMsg;
	}

	public String getTaskProcessingStatus() {
		return taskProcessingStatus;
	}

	public void setTaskProcessingStatus(String taskProcessingStatus) {
		this.taskProcessingStatus = taskProcessingStatus;
	}

	public String getTaskProcessingEndTime() {
		return taskProcessingEndTime;
	}

	public void setTaskProcessingEndTime(String taskProcessingEndTime) {
		this.taskProcessingEndTime = taskProcessingEndTime;
	}

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

	
}
