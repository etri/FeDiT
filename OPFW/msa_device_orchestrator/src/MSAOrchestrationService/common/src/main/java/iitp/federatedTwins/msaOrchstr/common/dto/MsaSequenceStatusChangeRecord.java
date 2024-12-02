package iitp.federatedTwins.msaOrchstr.common.dto;

/**
 * @파일명 : MsaSequenceStatusChangeRecord.java
 * @title : 제어시퀀스 상태변경 이력
 * @작성일 : 2023. 07. 20.
 * @작성자 : 오세광
 * @description :
 */
public class MsaSequenceStatusChangeRecord {

	/**
	 * 
	 * 제어 시퀀스 상태 변경 ID
	 */
	private int sequenceStatusChangeId;
	/**
	 * 
	 * MSA 제어요청 ID
	 */
	private int requestControlCommandId;
	/**
	 * 
	 * 제어 시퀀스 단위 실행 ID
	 */
	private int ctrlCmdSequenceId;
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
	 * 제어시퀀스 요청 결과 수신 ID
	 */
	private int taskResponseId;


	public int getRequestControlCommandId() {
		return requestControlCommandId;
	}

	public void setRequestControlCommandId(int requestControlCommandId) {
		this.requestControlCommandId = requestControlCommandId;
	}

	public int getCtrlCmdSequenceId() {
		return ctrlCmdSequenceId;
	}

	public void setCtrlCmdSequenceId(int ctrlCmdSequenceId) {
		this.ctrlCmdSequenceId = ctrlCmdSequenceId;
	}

	public int getSequenceStatusChangeId() {
		return sequenceStatusChangeId;
	}

	public void setSequenceStatusChangeId(int sequenceStatusChangeId) {
		this.sequenceStatusChangeId = sequenceStatusChangeId;
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

	public int getTaskResponseId() {
		return taskResponseId;
	}

	public void setTaskResponseId(int taskResponseId) {
		this.taskResponseId = taskResponseId;
	}

}
