package iitp.federatedTwins.DtEvtTracking.common.dto;

public class TrackingResultDataTransmissionInfo {

	private int transmissionId;
	private int requestTrackingId;
	private int transmissionCode;
	private String transmissionMsg;
	private String transmissionTime;
	private String transmissionUrl;
	private String transmissionParam;
	private String transmissionResultData;
	private String respCtrlCmdCode;
	private String respCtrlCmdMsg;
	private String respCtrlCmdTime;

	public int getTransmissionId() {
		return transmissionId;
	}

	public void setTransmissionId(int transmissionId) {
		this.transmissionId = transmissionId;
	}

	public int getRequestTrackingId() {
		return requestTrackingId;
	}

	public void setRequestTrackingId(int requestTrackingId) {
		this.requestTrackingId = requestTrackingId;
	}

	public int getTransmissionCode() {
		return transmissionCode;
	}

	public void setTransmissionCode(int transmissionCode) {
		this.transmissionCode = transmissionCode;
	}

	public String getTransmissionMsg() {
		return transmissionMsg;
	}

	public void setTransmissionMsg(String transmissionMsg) {
		this.transmissionMsg = transmissionMsg;
	}

	public String getTransmissionTime() {
		return transmissionTime;
	}

	public void setTransmissionTime(String transmissionTime) {
		this.transmissionTime = transmissionTime;
	}

	public String getTransmissionUrl() {
		return transmissionUrl;
	}

	public void setTransmissionUrl(String transmissionUrl) {
		this.transmissionUrl = transmissionUrl;
	}

	public String getTransmissionParam() {
		return transmissionParam;
	}

	public void setTransmissionParam(String transmissionParam) {
		this.transmissionParam = transmissionParam;
	}

	public String getTransmissionResultData() {
		return transmissionResultData;
	}

	public void setTransmissionResultData(String transmissionResultData) {
		this.transmissionResultData = transmissionResultData;
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

}
