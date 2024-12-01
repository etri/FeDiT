package iitp.federatedTwins.msaOrchstr.common.dto;

/**
 * @파일명 : MsaControlCommandStatusChangeRecord.java
 * @title : MSA 요청 정보 상태변경 이력
 * @작성일 : 2023. 07. 20.
 * @작성자 : 오세광
 * @description :
 */
public class MsaControlCommandStatusChangeRecord {

	/**
	 * 
	 * MSA 요청상태 변경 ID
	 */
	private int ctrlCmdStatusChangeId;
	/**
	 * 
	 * MSA 제어요청 ID
	 */
	private int requestControlCommandId;
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
	 * 상태변경 처리 결과 MSG
	 */
	private String statusResultMsg;

	public int getCtrlCmdStatusChangeId() {
		return ctrlCmdStatusChangeId;
	}

	public void setCtrlCmdStatusChangeId(int ctrlCmdStatusChangeId) {
		this.ctrlCmdStatusChangeId = ctrlCmdStatusChangeId;
	}
	
	public int getRequestControlCommandId() {
		return requestControlCommandId;
	}

	public void setRequestControlCommandId(int requestControlCommandId) {
		this.requestControlCommandId = requestControlCommandId;
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

}
