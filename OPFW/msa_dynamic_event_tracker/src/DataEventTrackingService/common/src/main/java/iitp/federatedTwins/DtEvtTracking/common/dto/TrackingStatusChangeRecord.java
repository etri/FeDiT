package iitp.federatedTwins.DtEvtTracking.common.dto;

/**
 * @파일명 : TrackingStatusChangeRecord.java
 * @title : 트래킹 요청정보 상태변경 이력
 * @작성일 : 2023. 11. 16.
 * @작성자 : 오세광
 * @description :
 */
public class TrackingStatusChangeRecord {

	/**
	 * 
	 * 트래킹 요청상태 변경 ID
	 */
	private int trackingStatusChangeId;
	/**
	 * 
	 * 상태변경 일자
	 */
	private String statusUpdateTime;
	/**
	 * 
	 * 변경 요청 상태
	 */
	private String changeStatus;
	/**
	 * 
	 * 상태변경 처리 결과
	 */
	private String statusResultMsg;
	/**
	 * 
	 * 동적 데이터/이벤트 트래킹 요청 ID
	 */
	private int requestTrackingId;

	public int getTrackingStatusChangeId() {
		return trackingStatusChangeId;
	}

	public void setTrackingStatusChangeId(int trackingStatusChangeId) {
		this.trackingStatusChangeId = trackingStatusChangeId;
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


	public int getRequestTrackingId() {
		return requestTrackingId;
	}

	public void setRequestTrackingId(int requestTrackingId) {
		this.requestTrackingId = requestTrackingId;
	}

}
