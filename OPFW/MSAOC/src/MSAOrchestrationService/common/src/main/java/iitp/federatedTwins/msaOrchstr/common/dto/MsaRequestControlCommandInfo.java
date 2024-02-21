package iitp.federatedTwins.msaOrchstr.common.dto;

/**
 * @파일명 : MsaRequestControlCommandInfo.java
 * @title : MSA 제어명령 요청 정보
 * @작성일 : 2023. 07. 20.
 * @작성자 : 오세광
 * @description :
 */
public class MsaRequestControlCommandInfo {

	private int requestControlCommandId;

	private String reqCtrlCmdType;

	private String reqCtrlCmdTime;

	private String reqCtrlCmdStatus;

	private String resultCallBackUrl;

	private String reqCtrlCmd;

	private String reqIdentifier;

	private String msaIdentifier;

	private String reqStatusChangeTime;

	private String transmissionStatus;

	private String transmissionTime;

	public int getRequestControlCommandId() {
		return requestControlCommandId;
	}

	public void setRequestControlCommandId(int requestControlCommandId) {
		this.requestControlCommandId = requestControlCommandId;
	}

	public String getReqCtrlCmdType() {
		return reqCtrlCmdType;
	}

	public void setReqCtrlCmdType(String reqCtrlCmdType) {
		this.reqCtrlCmdType = reqCtrlCmdType;
	}

	public String getReqCtrlCmdTime() {
		return reqCtrlCmdTime;
	}

	public void setReqCtrlCmdTime(String reqCtrlCmdTime) {
		this.reqCtrlCmdTime = reqCtrlCmdTime;
	}

	public String getReqCtrlCmdStatus() {
		return reqCtrlCmdStatus;
	}

	public void setReqCtrlCmdStatus(String reqCtrlCmdStatus) {
		this.reqCtrlCmdStatus = reqCtrlCmdStatus;
	}

	public String getResultCallBackUrl() {
		return resultCallBackUrl;
	}

	public void setResultCallBackUrl(String resultCallBackUrl) {
		this.resultCallBackUrl = resultCallBackUrl;
	}

	public String getReqCtrlCmd() {
		return reqCtrlCmd;
	}

	public void setReqCtrlCmd(String reqCtrlCmd) {
		this.reqCtrlCmd = reqCtrlCmd;
	}

	public String getReqIdentifier() {
		return reqIdentifier;
	}

	public void setReqIdentifier(String reqIdentifier) {
		this.reqIdentifier = reqIdentifier;
	}

	public String getMsaIdentifier() {
		return msaIdentifier;
	}

	public void setMsaIdentifier(String msaIdentifier) {
		this.msaIdentifier = msaIdentifier;
	}

	public String getReqStatusChangeTime() {
		return reqStatusChangeTime;
	}

	public void setReqStatusChangeTime(String reqStatusChangeTime) {
		this.reqStatusChangeTime = reqStatusChangeTime;
	}

	public String getTransmissionStatus() {
		return transmissionStatus;
	}

	public void setTransmissionStatus(String transmissionStatus) {
		this.transmissionStatus = transmissionStatus;
	}

	public String getTransmissionTime() {
		return transmissionTime;
	}

	public void setTransmissionTime(String transmissionTime) {
		this.transmissionTime = transmissionTime;
	}
}
