package iitp.federatedTwins.msaOrchstr.common.dto;

/**
 * @파일명 : MsaResponseControlCommandInfo.java
 * @title : MSA 제어명령 요청 응답처리 정보
 * @작성일 : 2023. 07. 20.
 * @작성자 : 오세광
 * @description :
 */
public class MsaResponseControlCommandInfo {

	private int respCtrlCmdId;

	private String respCtrlCmdCode;

	private String respCtrlCmdMsg;

	private String respCtrlCmdTime;

	private int requestControlCommandId;

	public int getRespCtrlCmdId() {
		return respCtrlCmdId;
	}

	public void setRespCtrlCmdId(int respCtrlCmdId) {
		this.respCtrlCmdId = respCtrlCmdId;
	}

	public String getRespCtrlCmdCode() {
		return respCtrlCmdCode;
	}

	public void setRespCtrlCmdCode(String respCtrlCmdCode) {
		this.respCtrlCmdCode = respCtrlCmdCode;
	}

	public String getRespCtrlCmdMsg() {
		return respCtrlCmdMsg;
	}

	public void setRespCtrlCmdMsg(String respCtrlCmdMsg) {
		this.respCtrlCmdMsg = respCtrlCmdMsg;
	}

	public String getRespCtrlCmdTime() {
		return respCtrlCmdTime;
	}

	public void setRespCtrlCmdTime(String respCtrlCmdTime) {
		this.respCtrlCmdTime = respCtrlCmdTime;
	}

	public int getRequestControlCommandId() {
		return requestControlCommandId;
	}

	public void setRequestControlCommandId(int requestControlCommandId) {
		this.requestControlCommandId = requestControlCommandId;
	}

}
