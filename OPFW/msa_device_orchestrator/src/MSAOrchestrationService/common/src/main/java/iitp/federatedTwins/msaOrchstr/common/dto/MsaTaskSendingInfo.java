package iitp.federatedTwins.msaOrchstr.common.dto;

/**
 * @파일명 : MsaTaskSendingInfo.java
 * @title : 제어시퀀스 요청정보 전송 정보
 * @작성일 : 2023. 07. 26.
 * @작성자 : 오세광
 * @description :
 */
public class MsaTaskSendingInfo {

	/**
	 * 
	 * 제어 시퀀스 전송 ID
	 */
	private int taskSendingId;
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
	/**
	 * 
	 * 양방향 동기화 접속 URL
	 */
	private String taskConnectionUrl;
	/**
	 * 
	 * 양방향 동기화 전송 파라메터
	 */
	private String taskSendingControlCommandParam;
	/**
	 * 
	 * 양방향 동기화 전송 제어 시퀀스 명령
	 */
	private String taskSendingControlCommand;
	/**
	 * 
	 * 전송 일시
	 */
	private String taskSendingTime;
	/**
	 * 
	 * 전송 상태
	 */
	private String taskSendingStatus;
	/**
	 * 
	 * 전송 처리 결과 MSG
	 */
	private String taskReceiveResultMsg;
	/**
	 * 
	 * 제어요청 정보 식별자  task_sending_identifiier
	 */
	private String taskSendingIdentifier;

	public int getTaskSendingId() {
		return taskSendingId;
	}

	public void setTaskSendingId(int taskSendingId) {
		this.taskSendingId = taskSendingId;
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

	public String getTaskConnectionUrl() {
		return taskConnectionUrl;
	}

	public void setTaskConnectionUrl(String taskConnectionUrl) {
		this.taskConnectionUrl = taskConnectionUrl;
	}

	public String getTaskSendingControlCommandParam() {
		return taskSendingControlCommandParam;
	}

	public void setTaskSendingControlCommandParam(String taskSendingControlCommandParam) {
		this.taskSendingControlCommandParam = taskSendingControlCommandParam;
	}

	public String getTaskSendingControlCommand() {
		return taskSendingControlCommand;
	}

	public void setTaskSendingControlCommand(String taskSendingControlCommand) {
		this.taskSendingControlCommand = taskSendingControlCommand;
	}

	public String getTaskSendingTime() {
		return taskSendingTime;
	}

	public void setTaskSendingTime(String taskSendingTime) {
		this.taskSendingTime = taskSendingTime;
	}

	public String getTaskSendingStatus() {
		return taskSendingStatus;
	}

	public void setTaskSendingStatus(String taskSendingStatus) {
		this.taskSendingStatus = taskSendingStatus;
	}

	public String getTaskSendingIdentifier() {
		return taskSendingIdentifier;
	}

	public void setTaskSendingIdentifier(String taskSendingIdentifier) {
		this.taskSendingIdentifier = taskSendingIdentifier;
	}

	public String getTaskReceiveResultMsg() {
		return taskReceiveResultMsg;
	}

	public void setTaskReceiveResultMsg(String taskReceiveResultMsg) {
		this.taskReceiveResultMsg = taskReceiveResultMsg;
	}

}
