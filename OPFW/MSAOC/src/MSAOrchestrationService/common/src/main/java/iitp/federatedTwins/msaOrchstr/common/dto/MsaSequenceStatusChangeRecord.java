package iitp.federatedTwins.msaOrchstr.common.dto;

/**
 * @파일명 : MsaSequenceStatusChangeRecord.java
 * @title : 제어시퀀스 상태변경 이력
 * @작성일 : 2023. 07. 20.
 * @작성자 : 오세광
 * @description :
 */
public class MsaSequenceStatusChangeRecord {

	private int sequenceStatusChangeId;

	private int requestControlCommandId;

	private int ctrlCmdSequenceId;

	private String statusUpdateTime;

	private String changeStatus;

	private String statusResultMsg;

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
