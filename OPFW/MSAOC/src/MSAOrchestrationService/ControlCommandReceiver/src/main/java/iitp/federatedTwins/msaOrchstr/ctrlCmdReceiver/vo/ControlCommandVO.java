package iitp.federatedTwins.msaOrchstr.ctrlCmdReceiver.vo;

/**
 * @파일명 : ControlCommandVO.java
 * @작성일 : 2023. 07. 20.
 * @작성자 : 오세광
 * @변경이력 :
 * @description :
 */

public class ControlCommandVO {

	private String requestIdtifier;
	private String callBackURL;
	private String reqCtrlCmdType;
	private CtrlSequencesVO ctrlSequences[];

	private int requestControlCommandId;

	public int getRequestControlCommandId() {
		return requestControlCommandId;
	}

	public void setRequestControlCommandId(int requestControlCommandId) {
		this.requestControlCommandId = requestControlCommandId;
	}

	public String getRequestIdtifier() {
		return requestIdtifier;
	}

	public void setRequestIdtifier(String requestIdtifier) {
		this.requestIdtifier = requestIdtifier;
	}

	public String getCallBackURL() {
		return callBackURL;
	}

	public void setCallBackURL(String callBackURL) {
		this.callBackURL = callBackURL;
	}

	public CtrlSequencesVO[] getCtrlSequences() {
		return ctrlSequences;
	}

	public void setCtrlSequences(CtrlSequencesVO[] ctrlSequences) {
		this.ctrlSequences = ctrlSequences;
	}

	public String getReqCtrlCmdType() {
		return reqCtrlCmdType;
	}

	public void setReqCtrlCmdType(String reqCtrlCmdType) {
		this.reqCtrlCmdType = reqCtrlCmdType;
	}
}
