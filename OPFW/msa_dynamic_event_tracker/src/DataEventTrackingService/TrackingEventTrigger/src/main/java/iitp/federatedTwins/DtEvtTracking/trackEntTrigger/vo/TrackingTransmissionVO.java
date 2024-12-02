package iitp.federatedTwins.DtEvtTracking.trackEntTrigger.vo;

/**
 * @파일명 : TrackingTransmissionVO.java
 * @title : 동적 데이터/이벤트 트래킹 요청 처리결과 전송 정보
 * @작성일 : 2023. 11. 16.
 * @작성자 : 오세광
 * @description :
 */
public class TrackingTransmissionVO {

	/**
	 * 
	 * 동적 데이터/이벤트 트래킹 요청 ID
	 */
	private int requestTrackingId;

	/**
	 * 
	 * Client 요청 식별자
	 */
	private String reqTrckCmdType;
	/**
	 * 
	 * 요청일시
	 */
	private String reqTrckCmdTime;
	/**
	 * 
	 * 요청상태
	 */
	private String reqTrckCmdStatus;
	/**
	 * 
	 * 요청처리 결과 전송 URL
	 */
	private String resultCallbackUrl;
	/**
	 * 
	 * 트래킹 요청 전문
	 */
	private String reqTrackingCmd;
	/**
	 * 
	 * 요청 타입
	 */
	private String trackingIdentifier;
	/**
	 * 
	 * 트래킹 요청 최종 처리상태 반영일시
	 */
	private String reqStatusChangeTime;
	/**
	 * 
	 * 트래킹 요청 최종 처리상태 반영일시
	 */
	private String transmissionStatus;
	/**
	 * 
	 * 처리결과 전송일시
	 */
	private String transmissionTime;
	/**
	 * 
	 * 제어 시퀀스 전송 ID
	 */
	private String reqIdentifier;

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

	public int getRequestTrackingId() {
		return requestTrackingId;
	}

	public void setRequestTrackingId(int requestTrackingId) {
		this.requestTrackingId = requestTrackingId;
	}

	public String getReqTrckCmdType() {
		return reqTrckCmdType;
	}

	public void setReqTrckCmdType(String reqTrckCmdType) {
		this.reqTrckCmdType = reqTrckCmdType;
	}

	public String getReqTrckCmdTime() {
		return reqTrckCmdTime;
	}

	public void setReqTrckCmdTime(String reqTrckCmdTime) {
		this.reqTrckCmdTime = reqTrckCmdTime;
	}

	public String getReqTrckCmdStatus() {
		return reqTrckCmdStatus;
	}

	public void setReqTrckCmdStatus(String reqTrckCmdStatus) {
		this.reqTrckCmdStatus = reqTrckCmdStatus;
	}

	public String getResultCallbackUrl() {
		return resultCallbackUrl;
	}

	public void setResultCallbackUrl(String resultCallbackUrl) {
		this.resultCallbackUrl = resultCallbackUrl;
	}

	public String getReqTrackingCmd() {
		return reqTrackingCmd;
	}

	public void setReqTrackingCmd(String reqTrackingCmd) {
		this.reqTrackingCmd = reqTrackingCmd;
	}

	public String getTrackingIdentifier() {
		return trackingIdentifier;
	}

	public void setTrackingIdentifier(String trackingIdentifier) {
		this.trackingIdentifier = trackingIdentifier;
	}

	public String getTransmissionStatus() {
		return transmissionStatus;
	}

	public void setTransmissionStatus(String transmissionStatus) {
		this.transmissionStatus = transmissionStatus;
	}

	public String getHttpCode() {
		return httpCode;
	}

	public void setHttpCode(String httpCode) {
		this.httpCode = httpCode;
	}

	public String getHttpReasonPhrase() {
		return httpReasonPhrase;
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
