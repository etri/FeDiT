package iitp.federatedTwins.msaOrchstr.ctrlCmdReceiver.vo;

/**
 * @파일명 : RegisterFdtObjVO.java
 * @작성일 : 2023. 07. 20.
 * @작성자 : 오세광
 * @변경이력 :
 * @description :
 */

public class RegisterFdtObjVO {

	private String requestIdtifier;
	private String callBackURL;

	private String digitalTwinId;

	private String digitalObjId;

	private String digitalControlId;

	private String controlCommand;

	private String ctrlCondition;

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

	public String getDigitalTwinId() {
		return digitalTwinId;
	}

	public void setDigitalTwinId(String digitalTwinId) {
		this.digitalTwinId = digitalTwinId;
	}

	public String getDigitalObjId() {
		return digitalObjId;
	}

	public void setDigitalObjId(String digitalObjId) {
		this.digitalObjId = digitalObjId;
	}

	public String getDigitalControlId() {
		return digitalControlId;
	}

	public void setDigitalControlId(String digitalControlId) {
		this.digitalControlId = digitalControlId;
	}

	public String getControlCommand() {
		return controlCommand;
	}

	public void setControlCommand(String controlCommand) {
		this.controlCommand = controlCommand;
	}

	public String getCtrlCondition() {
		return ctrlCondition;
	}

	public void setCtrlCondition(String ctrlCondition) {
		this.ctrlCondition = ctrlCondition;
	}
}
