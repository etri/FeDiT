package iitp.federatedTwins.msaOrchstr.common.dto;

/**
 * @파일명 : MsaResultDataTransmissionInfo.java
 * @title : MSA 요청 처리결과 전송 정보
 * @작성일 : 2023. 07. 20.
 * @작성자 : 오세광
 * @description :
 */
public class MsaResultDataTransmissionInfo {

	private int transmissionId;

	private int requestControlCommandId;

	private int transmissionCode;

	private String transmissionMsg;

	private String transmissionTime;

	private String transmissionUrl;

	private String transmissionParam;

	private String transmissionResultData;

	private String respCtrlCmdCode;

	private String respCtrlCmdMsg;

	private String respCtrlCmdTime;

	private String httpResult;

	public int getTransmissionId() {
		return transmissionId;
	}

	public void setTransmissionId(int transmissionId) {
		this.transmissionId = transmissionId;
	}

	public int getRequestControlCommandId() {
		return requestControlCommandId;
	}

	public void setRequestControlCommandId(int requestControlCommandId) {
		this.requestControlCommandId = requestControlCommandId;
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

//	public int getRespCtrlCmdCode() {
//		return respCtrlCmdCode;
//	}
//
//	public void setRespCtrlCmdCode(int respCtrlCmdCode) {
//		this.respCtrlCmdCode = respCtrlCmdCode;
//	}

	public String getRespCtrlCmdMsg() {
		return respCtrlCmdMsg;
	}

	public String getRespCtrlCmdCode() {
		return respCtrlCmdCode;
	}

	public void setRespCtrlCmdCode(String respCtrlCmdCode) {
		this.respCtrlCmdCode = respCtrlCmdCode;
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

	public String getHttpResult() {
		return httpResult;
	}

	public void setHttpResult(String httpResult) {
		this.httpResult = httpResult;
	}

}
