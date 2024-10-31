package iitp.federatedTwins.DtEvtTracking.common.dto;

/**
 * @파일명 : TrackingSequenceStatusChangeRecord.java
 * @title : 트래깅 요청 상태변경 이력
 * @작성일 : 2023. 11. 16.
 * @작성자 : 오세광
 * @description :
 */
public class TrackingProcessStatusChangeRecord {

	/**
	 * 
	 * 트래킹 요청 실행 상태 변경 ID
	 */
	private int processStatusChangeId;
	/**
	 * 
	 * 동적 데이터/이벤트 트래킹 요청 ID
	 */
	private int requestTrackingId;
	/**
	 * 
	 * 트래킹 요청 실행 ID
	 */
	private int trackingProcessId;
	/**
	 * 
	 * 상태변경 일시
	 */
	private String statusUpdateTime;
	/**
	 * 
	 * 변경 요청 상태
	 */
	private String changeStatus;
	/**
	 * 
	 * 상태변경 처리 결과 MSG
	 */
	private String statusResultMsg;

	/**
	 * 
	 * 요청 결과 수신 ID
	 */
	private int trackingResponseId;



	public int getProcessStatusChangeId() {
		return processStatusChangeId;
	}

	public void setProcessStatusChangeId(int processStatusChangeId) {
		this.processStatusChangeId = processStatusChangeId;
	}

	public String getStatusUpdateTime() {
		return statusUpdateTime;
	}

	public void setStatusUpdateTime(String statusUpdateTime) {
		this.statusUpdateTime = statusUpdateTime;
	}

	public String getChangeStatus() {
		return changeStatus;
	}

	public void setChangeStatus(String changeStatus) {
		this.changeStatus = changeStatus;
	}

	public String getStatusResultMsg() {
		return statusResultMsg;
	}

	public void setStatusResultMsg(String statusResultMsg) {
		this.statusResultMsg = statusResultMsg;
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

	public int getRequestTrackingId() {
		return requestTrackingId;
	}

	public void setRequestTrackingId(int requestTrackingId) {
		this.requestTrackingId = requestTrackingId;
	}

}
