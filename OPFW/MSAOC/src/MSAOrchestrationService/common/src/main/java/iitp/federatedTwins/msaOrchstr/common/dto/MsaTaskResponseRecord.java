package iitp.federatedTwins.msaOrchstr.common.dto;

/**
 * @파일명 : MsaTaskResponseDataInfo.java
 * @title : 제어시퀀스 요청 결과 수신 정보
 * @작성일 : 2023. 07. 20.
 * @작성자 : 오세광
 * @description :
 */
public class MsaTaskResponseRecord {

	private int taskResponseId;

	private int taskSendingId;

	private String receiveTime;

	private String receiveVal;

	private String receiveStatus;

	private String receiveMsg;

	private int taskProcessingId;

	private int ctrlCmdSequenceId;

	private int requestControlCommandId;

	public int getTaskResponseId() {
		return taskResponseId;
	}

	public void setTaskResponseId(int taskResponseId) {
		this.taskResponseId = taskResponseId;
	}

	public int getTaskSendingId() {
		return taskSendingId;
	}

	public void setTaskSendingId(int taskSendingId) {
		this.taskSendingId = taskSendingId;
	}

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

}
