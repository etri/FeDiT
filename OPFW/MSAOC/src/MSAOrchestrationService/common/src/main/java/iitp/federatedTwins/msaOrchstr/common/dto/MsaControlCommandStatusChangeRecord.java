package iitp.federatedTwins.msaOrchstr.common.dto;

/**
 * @파일명 : MsaControlCommandStatusChangeRecord.java
 * @title : MSA 요청 정보 상태변경 이력
 * @작성일 : 2023. 07. 20.
 * @작성자 : 오세광
 * @description :
 */
public class MsaControlCommandStatusChangeRecord {


	private int ctrlCmdStatusChangeId;

	private int requestControlCommandId;

	private String statusUpdateTime;

	private String changeStatus;

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
