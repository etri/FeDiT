package iitp.federatedTwins.DtEvtTracking.trackCmdReceiver.vo;


public class RegisterFdtObjVO {
	
	private String requestIdtifier;
	private String callBackURL;
	private String digitalTwinId;
	private String digitalObjId;
	private String controlId;
	private String trackingCommand;

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

	public String getControlId() {
		return controlId;
	}

	public void setControlId(String controlId) {
		this.controlId = controlId;
	}

	public String getTrackingCommand() {
		return trackingCommand;
	}

	public void setTrackingCommand(String trackingCommand) {
		this.trackingCommand = trackingCommand;
	}
}
