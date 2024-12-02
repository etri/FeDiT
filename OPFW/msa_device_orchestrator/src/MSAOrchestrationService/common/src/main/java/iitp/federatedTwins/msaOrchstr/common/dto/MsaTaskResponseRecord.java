package iitp.federatedTwins.msaOrchstr.common.dto;

/**
 * @파일명 : MsaTaskResponseDataInfo.java
 * @title : 제어시퀀스 요청 결과 수신 정보
 * @작성일 : 2023. 07. 20.
 * @작성자 : 오세광
 * @description :
 */
public class MsaTaskResponseRecord {

	/**
	 * 
	 * 제어시퀀스 요청 결과 수신 ID
	 */
	private int taskResponseId;
	/**
	 * 
	 * 제어 시퀀스 전송 ID
	 */
	private int taskSendingId;
	/**
	 * 
	 * 결과 수신 일시
	 */
	private String receiveTime;
	/**
	 * 
	 * 결과 수신 값
	 */
	private String receiveVal;
	/**
	 * 
	 * 수신 상태 값
	 */
	private String receiveStatus;
	/**
	 * 
	 * 수신 상태 MSG
	 */
	private String receiveMsg;
	/**
	 * 
	 * 제어 시퀀스 Proc ID
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
