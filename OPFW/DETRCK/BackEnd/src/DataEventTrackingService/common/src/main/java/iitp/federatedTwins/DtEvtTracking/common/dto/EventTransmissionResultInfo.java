package iitp.federatedTwins.DtEvtTracking.common.dto;

public class EventTransmissionResultInfo {

	private int evnetTransMissionResultId;
	private int eventOccuredId;
	private int detectorProcId;
	private int trackingProcessId;
	private int requestTrackingId;
	private String eventTransmissionStatus;
	private String transmissionUrl;
	private String transmissionParam;
	private String eventOccuredMsg;
	private String transmissionTime;
	private String transmissionRespCode;
	private String transmissionRespMsg;

	public int getEvnetTransMissionResultId() {
		return evnetTransMissionResultId;
	}

	public void setEvnetTransMissionResultId(int evnetTransMissionResultId) {
		this.evnetTransMissionResultId = evnetTransMissionResultId;
	}

	public int getEventOccuredId() {
		return eventOccuredId;
	}

	public void setEventOccuredId(int eventOccuredId) {
		this.eventOccuredId = eventOccuredId;
	}

	public int getDetectorProcId() {
		return detectorProcId;
	}

	public void setDetectorProcId(int detectorProcId) {
		this.detectorProcId = detectorProcId;
	}

	public int getTrackingProcessId() {
		return trackingProcessId;
	}

	public void setTrackingProcessId(int trackingProcessId) {
		this.trackingProcessId = trackingProcessId;
	}

	public int getRequestTrackingId() {
		return requestTrackingId;
	}

	public void setRequestTrackingId(int requestTrackingId) {
		this.requestTrackingId = requestTrackingId;
	}

	public String getEventTransmissionStatus() {
		return eventTransmissionStatus;
	}

	public void setEventTransmissionStatus(String eventTransmissionStatus) {
		this.eventTransmissionStatus = eventTransmissionStatus;
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

	public String getEventOccuredMsg() {
		return eventOccuredMsg;
	}

	public void setEventOccuredMsg(String eventOccuredMsg) {
		this.eventOccuredMsg = eventOccuredMsg;
	}

	public String getTransmissionTime() {
		return transmissionTime;
	}

	public void setTransmissionTime(String transmissionTime) {
		this.transmissionTime = transmissionTime;
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
