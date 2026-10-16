package iitp.federatedTwins.DtEvtTracking.trackEntTrigger.vo;

public class TrackingTransmissionVO {

	private int requestTrackingId;

	private String reqTrckCmdType;
	private String reqTrckCmdTime;
	private String reqTrckCmdStatus;
	private String resultCallbackUrl;
	private String reqTrackingCmd;
	private String trackingIdentifier;
	private String reqStatusChangeTime;
	private String transmissionStatus;
	private String transmissionTime;
	private String reqIdentifier;

	private int transmissionId;
	private int transmissionCode;
	private String transmissionMsg;
	private String transmissionUrl;
	private String transmissionParam;
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
