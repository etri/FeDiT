package iitp.federatedTwins.msaOrchstr.common.dto;

/**
 * @파일명 : MsaTaskProcessingInfo.java
 * @title : 제어시퀀스 Proc 정보
 * @작성일 : 2023. 07. 20.
 * @작성자 : 오세광
 * @description :
 */
public class MsaTaskProcessingInfo {

	/**
	 * 
	 * 제어 시퀀스 ProcId
	 */
	private int taskProcessingId;
	/**
	 * 
	 * 제어 시퀀스 단위 실행 ID
	 */
	private int ctrlCmdSequenceId;
	/**
	 * 
	 * MSA 제어요청 ID
	 */
	private int requestControlCommandId;
	/**
	 * 
	 * 제어 시퀀스 Proc 실행 시작일시
	 */
	private String taskProcessingStartTime;
	/**
	 * 
	 * 제어 시퀀스 Proc 실행 처리 결과 MSG
	 */
	private String taskProcessingResultMsg;
	/**
	 * 
	 * 제어 시퀀스 Proc 실행 처리 결과 상태
	 */
	private String taskProcessingStatus;
	/**
	 * 
	 * 제어 시퀀스 Proc 실행 종료일시
	 */
	private String taskProcessingEndTime;

	public int getTaskProcessingId() {
		return taskProcessingId;
	}

	public void setTaskProcessingId(int taskProcessingId) {
		this.taskProcessingId = taskProcessingId;
	}

	public int getCtrlCmdSequenceId() {
		return ctrlCmdSequenceId;
	}

	public void setCtrlCmdSequenceId(int ctrlCmdSequenceId) {
		this.ctrlCmdSequenceId = ctrlCmdSequenceId;
	}

	public int getRequestControlCommandId() {
		return requestControlCommandId;
	}

	public void setRequestControlCommandId(int requestControlCommandId) {
		this.requestControlCommandId = requestControlCommandId;
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

}
