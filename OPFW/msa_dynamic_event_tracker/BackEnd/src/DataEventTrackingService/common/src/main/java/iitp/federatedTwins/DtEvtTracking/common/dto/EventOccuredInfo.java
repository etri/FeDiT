package iitp.federatedTwins.DtEvtTracking.common.dto;

public class EventOccuredInfo {

	private int eventOccuredId;
	private int detectorProcId;
	private int trackingProcessId;
	private int requestTrackingId;
	private String eventOccuredTime;
	private String eventTransMittedStatus;
	private String eventTransmittedTime;
	private String eventOccuredMsg;

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

	public String getEventOccuredTime() {
		return eventOccuredTime;
	}

	public void setEventOccuredTime(String eventOccuredTime) {
		this.eventOccuredTime = eventOccuredTime;
	}

	public String getEventTransMittedStatus() {
		return eventTransMittedStatus;
	}

	public void setEventTransMittedStatus(String eventTransMittedStatus) {
		this.eventTransMittedStatus = eventTransMittedStatus;
	}

	public String getEventTransmittedTime() {
		return eventTransmittedTime;
	}

	public void setEventTransmittedTime(String eventTransmittedTime) {
		this.eventTransmittedTime = eventTransmittedTime;
	}

	public String getEventOccuredMsg() {
		return eventOccuredMsg;
	}

	public void setEventOccuredMsg(String eventOccuredMsg) {
		this.eventOccuredMsg = eventOccuredMsg;
	}

}
