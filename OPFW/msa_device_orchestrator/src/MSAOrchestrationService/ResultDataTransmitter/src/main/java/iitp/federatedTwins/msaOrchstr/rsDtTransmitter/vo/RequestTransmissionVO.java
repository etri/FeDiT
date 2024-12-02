package iitp.federatedTwins.msaOrchstr.rsDtTransmitter.vo;

/**
 * @파일명 : MsaRequestControlCommandInfo.java
 * @title : MSA 제어명령 요청 정보
 * @작성일 : 2023. 07. 20.
 * @작성자 : 오세광
 * @description :
 */
public class RequestTransmissionVO {

	// FK
	private int requestControlCommandId;

	private String reqCtrlCmdType;
	private String reqCtrlCmdTime;
	private String reqCtrlCmdStatus;
	private String resultCallBackUrl;
	private String reqCtrlCmd;
	private String reqIdentifier;
	private String reqStatusChangeTime;
	private String reqCompleteStatus;
	private String reqCompleteDate;

	/**
	 * 
	 * 트래킹 요청 처리결과 전송 ID
	 */
	private int transmissionId;
	/**
	 * 
	 * 결과 전송처리 코드
	 */
	private int transmissionCode;
	/**
	 * 
	 * 결과 전송처리 결과 MSG
	 */
	private String transmissionMsg;
	/**
	 * 
	 * 처리결과 전송일시
	 */
	private String transmissionTime;
	/**
	 * 
	 * 결과 전송처리 URL
	 */
	private String transmissionUrl;
	/**
	 * 
	 * 결과 전송처리 파라메터
	 */
	private String transmissionParam;
	/**
	 * 
	 * 결과 전송처리 값
	 */
	private String transmissionResultData;


	private String httpCode;
	private String httpReasonPhrase;
	private String httpResult;
	

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

	public String getReqStatusChangeTime() {
		return reqStatusChangeTime;
	}

	public void setReqStatusChangeTime(String reqStatusChangeTime) {
		this.reqStatusChangeTime = reqStatusChangeTime;
	}

	public String getReqCompleteStatus() {
		return reqCompleteStatus;
	}

	public void setReqCompleteStatus(String reqCompleteStatus) {
		this.reqCompleteStatus = reqCompleteStatus;
	}

	public String getReqCompleteDate() {
		return reqCompleteDate;
	}

	public void setReqCompleteDate(String reqCompleteDate) {
		this.reqCompleteDate = reqCompleteDate;
	}

	public int getTransmissionId() {
		return transmissionId;
	}

	public void setTransmissionId(int transmissionId) {
		this.transmissionId = transmissionId;
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

//	public int getHttpCode() {
//		return httpCode;
//	}
//
//	public void setHttpCode(int httpCode) {
//		this.httpCode = httpCode;
//	}
	
	

	public String getHttpReasonPhrase() {
		return httpReasonPhrase;
	}

	public String getHttpCode() {
		return httpCode;
	}

	public void setHttpCode(String httpCode) {
		this.httpCode = httpCode;
	}

	public void setHttpReasonPhrase(String httpReasonPhrase) {
		this.httpReasonPhrase = httpReasonPhrase;
	}

	public String getHttpResult() {
		return httpResult;
	}

	public void setHttpResult(String httpResult) {
		this.httpResult = httpResult;
	}
	
}
