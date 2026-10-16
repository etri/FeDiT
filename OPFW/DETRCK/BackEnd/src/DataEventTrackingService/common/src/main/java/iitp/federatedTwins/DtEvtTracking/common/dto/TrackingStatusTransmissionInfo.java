package iitp.federatedTwins.DtEvtTracking.common.dto;

public class TrackingStatusTransmissionInfo {

	private long statusTransmissionId;

	private int requestTrackingId;

	private int trackingProcessId;

	private String msgStatus;

	private String lastObservedAt;

	private String noDataRefs;

	private String checkedTime;

	private String transmissionTime;

	private String transmissionStatus;

	private String transmissionUrl;

	private String transmissionParam;

	private String transmissionRespCode;

	private String transmissionRespMsg;

	public long getStatusTransmissionId() {
		return statusTransmissionId;
	}

	public void setStatusTransmissionId(long statusTransmissionId) {
		this.statusTransmissionId = statusTransmissionId;
	}

	public int getRequestTrackingId() {
		return requestTrackingId;
	}

	public void setRequestTrackingId(int requestTrackingId) {
		this.requestTrackingId = requestTrackingId;
	}

	public int getTrackingProcessId() {
		return trackingProcessId;
	}

	public void setTrackingProcessId(int trackingProcessId) {
		this.trackingProcessId = trackingProcessId;
	}

	public String getMsgStatus() {
		return msgStatus;
	}

	public void setMsgStatus(String msgStatus) {
		this.msgStatus = msgStatus;
	}

	public String getLastObservedAt() {
		return lastObservedAt;
	}

	public void setLastObservedAt(String lastObservedAt) {
		this.lastObservedAt = lastObservedAt;
	}

	public String getNoDataRefs() {
		return noDataRefs;
	}

	public void setNoDataRefs(String noDataRefs) {
		this.noDataRefs = noDataRefs;
	}

	public String getCheckedTime() {
		return checkedTime;
	}

	public void setCheckedTime(String checkedTime) {
		this.checkedTime = checkedTime;
	}

	public String getTransmissionTime() {
		return transmissionTime;
	}

	public void setTransmissionTime(String transmissionTime) {
		this.transmissionTime = transmissionTime;
	}

	public String getTransmissionStatus() {
		return transmissionStatus;
	}

	public void setTransmissionStatus(String transmissionStatus) {
		this.transmissionStatus = transmissionStatus;
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

	public String getTransmissionRespCode() {
		return transmissionRespCode;
	}

	public void setTransmissionRespCode(String transmissionRespCode) {
		this.transmissionRespCode = transmissionRespCode;
	}

	public String getTransmissionRespMsg() {
		return transmissionRespMsg;
	}

	public void setTransmissionRespMsg(String transmissionRespMsg) {
		this.transmissionRespMsg = transmissionRespMsg;
	}
}
